import { execSync } from "child_process"
import delay from "delay"
import fs, { PathLike } from "fs"
import fsp from "fs/promises"
import pop from "node-poppler"
import os from "os"
import path from "path"
import PDFMerger from "pdf-merger-js"
import xlsx from "xlsx"
import { logger } from "./log.js"
import { PNG } from "pngjs"
import scanner from "jsqr"

export function readXlsx(path: PathLike): Array<any> {
    const table = xlsx.read(fs.readFileSync(path), { type: "buffer" })
    var sheet_name_list = table.SheetNames
    return xlsx.utils.sheet_to_json(table.Sheets[sheet_name_list[0]])
}

const { Poppler } = pop
let poppler = new Poppler()
let tempDir = path.join(os.tmpdir(), "shopeeLabelPrinter")

interface Order {
    order_id: string
    index: number
    type: string
}

export enum Vendor {
    Sevenoneone = "Sevenoneone",
    Family = "Family",
    Okmart = "Okmart",
    Lai = "Lai",
}

export async function order_details(indexPath: string): Promise<Array<Order>> {
    let excel_data = readXlsx(path.resolve(indexPath))

    let order_ids = new Set()
    let idata: any = []
    for (let o of excel_data) {
        if (!order_ids.has(o.order_id)) {
            idata.push(o)
        }
        order_ids.add(o.order_id)
    }

    return idata
}

export async function makePdf(
    vendor: Vendor,
    inputLabelDirectory: string,
    outputDir: string,
    indexPath: string,
    openOnceDone: boolean,
) {
    let idata = await order_details(indexPath)
    logger.info(idata)
    let vendorMap = {
        sevenoneone: "711",
        okmart: "ok",
        lai: "Lai",
        family: "Family",
    }
    let output = {
        stats: 0,
        count: idata.filter(
            (v) =>
                `${v.type}`.toLowerCase() === `${vendor}`.toLowerCase() ||
                (vendorMap[`${vendor}`.toLowerCase()] || "").toLowerCase() === `${v.type}`.toLowerCase(),
        ).length,
        outputFile: null,
        input: { vendor, inputLabelDirectory, outputDir, indexPath, tempDir, openOnceDone },
    }

    logger.info(output)

    await fsp.mkdir(tempDir).catch((e) => undefined)

    try {
        let vendorPath = path.resolve(`${inputLabelDirectory}`, vendor)
        let vendorFolderContent = fs.readdirSync(`${vendorPath}`)

        let pdfTempFolder = path.resolve(tempDir, "pdfs")
        logger.info("Split pages")
        let four_pdf_in_page = []
        for (let laiFile of vendorFolderContent) {
            try {
                let airway_from_shopee_file = path.join(vendorPath, laiFile)
                await fsp.mkdir(pdfTempFolder, { recursive: true }).catch((e) => undefined)
                await poppler.pdfSeparate(airway_from_shopee_file, path.join(pdfTempFolder, "small-pdf-%d.pdf"))

                for (let f of fs.readdirSync(pdfTempFolder)) {
                    four_pdf_in_page.push({ file_name: f, buf: fs.readFileSync(path.join(pdfTempFolder, f)) })
                }
            } catch (e) {
                logger.info("Error on splitting", e)
            } finally {
                await fsp.rm(pdfTempFolder, { recursive: true }).catch((e) => undefined)
            }
        }

        logger.info(
            `Total Number Of Pages: ${four_pdf_in_page.length} so estimated labels ${four_pdf_in_page.length * 4}`,
        )

        let pdfBuffers = await scissor(four_pdf_in_page, vendor).catch((e) => {
            logger.info("Error on scissoring", e)
            return undefined
        })

        logger.info("Checking if pds are in excel. Total Labels:", pdfBuffers.length)
        let pdfIndexedBuffers = []
        for (let index in pdfBuffers) {
            let pth = path.join(tempDir, `tmp.pdf`)
            fs.writeFileSync(pth, pdfBuffers[index])

            if (vendor === Vendor.Family) {
                logger.info(`Searching Orders in PDF ${index} Total: ${pdfBuffers.length}`)
                let tmpImg = path.join(tempDir, "temp.png")
                await poppler.pdfToCairo(pth, path.join(tempDir, "temp"), {
                    pngFile: true,
                    singleFile: true,
                })
                const buffer = fs.readFileSync(tmpImg)
                const png = PNG.sync.read(buffer)
                const code = scanner(Uint8ClampedArray.from(png.data), png.width, png.height)
                const qrText = code?.data
                console.log("QR CODE IMAGE PATH", tmpImg, qrText)
                if (!qrText) {
                    console.log("Qr code not detected")
                    continue
                }
                await fsp.rm(tmpImg)

                for (let di in idata) {
                    let data = idata[di]
                    if (
                        qrText &&
                        qrText.includes(data.order_id) &&
                        !pdfIndexedBuffers.find((v) => v.index === data.index)
                    ) {
                        output.stats += 1

                        logger.info("Found it", data.index)
                        pdfIndexedBuffers.push({
                            index: data.index,
                            type: data.type,
                            buffer: pdfBuffers[index],
                        })
                    }
                }
            } else {
                // this is not family
                let pdftext = await poppler.pdfToText(pth).catch((e) => undefined)
                await fsp.rm(pth).catch((e) => undefined)

                logger.info(`Searching Orders in PDF ${index} Total: ${pdfBuffers.length}`)

                for (let di in idata) {
                    let data = idata[di]
                    if (
                        pdftext &&
                        pdftext.includes(data.order_id) &&
                        !pdfIndexedBuffers.find((v) => v.index === data.index)
                    ) {
                        output.stats += 1

                        logger.info("Found it", data.index)
                        pdfIndexedBuffers.push({
                            index: data.index,
                            type: data.type,
                            buffer: pdfBuffers[index],
                        })
                    }
                }
            }
        }

        logger.info("Sorting by index", pdfIndexedBuffers.length)
        pdfIndexedBuffers.sort((a, b) => {
            return a.index - b.index
        })

        let merger = new PDFMerger()
        logger.info("Merge PDF Start")
        for (let fileI in pdfIndexedBuffers) {
            let buffer = pdfIndexedBuffers[fileI]
            logger.info(`${fileI} of ${pdfIndexedBuffers.length} start`)

            let templatePath = path.resolve(tempDir, "tmp.html")
            fs.writeFileSync(
                templatePath,
                fs.readFileSync("./src/index_temp.html").toString().replaceAll("HELLO", buffer.index),
            )

            let template_pdf_pth = path.resolve(tempDir, `tmp.pdf`)
            logger.info(`${fileI} of ${pdfIndexedBuffers.length} wkhtmltopdf`)
            let exec = path.resolve("./bins/wkhtmltopdf.exe")
            let wkhtml = `${exec} -T 0 -R 0 --page-width 74 --page-height 100 --log-level error ${templatePath} ${template_pdf_pth}`
            execSync(wkhtml)

            await fsp.rm(templatePath).catch((e) => undefined)

            let srcPath = path.resolve(tempDir, "temp1.pdf")
            fs.writeFileSync(srcPath, buffer.buffer)

            let output = path.resolve(tempDir, "output.pdf")
            let pdftkexec = path.resolve("./bins/pdftk.exe")
            let pdftkcmd = `${pdftkexec}  ${template_pdf_pth}  multibackground  ${srcPath} output ${output}`
            logger.info(`${fileI} of ${pdfIndexedBuffers.length} pdftkcmd`)
            execSync(pdftkcmd)

            merger.add(output)
            await fsp.rm(srcPath).catch((e) => undefined)
            await fsp.rm(template_pdf_pth).catch((e) => undefined)
            await fsp.rm(output).catch((e) => undefined)
        }

        logger.info("Starting to merge to ouput")
        if (pdfIndexedBuffers.length >= 1) {
            let outputfilepath = path.join(outputDir, `${vendor}.pdf`)
            output.outputFile = outputfilepath
            logger.info("Saving to output file", outputfilepath)
            await merger.save(outputfilepath).catch((e) => logger.error("unable to merge"))
        } else {
            logger.warn("No pdfIndexedBufferLength")
        }
        logger.info("Completed")
    } catch (e) {
        logger.info("Error on pdf printer", e)
    } finally {
        //  await fsp.rm(tempDir, { recursive: true }).catch((e) => undefined)
    }
    logger.info("Completed")

    return output
}

async function scissor(four_pdf_in_page: Array<{ buf: Buffer; file_name: string }>, type: string) {
    let pdfBuffers = []

    if (type === "Sevenoneone") {
        let four = []
        for (let file of four_pdf_in_page) {
            if (file.file_name === "small-pdf-1.pdf") {
                await scisoorInner(file.buf, four, 30, 80, 490, 733)
            } else {
                await scisoorInner(file.buf, four, 30, 80, 490, 740)
            }
        }

        for (let filei in four) {
            four_pdf_in_page[filei].buf = four[filei]
        }
    } else if (type === "Family") {
        let four = []
        for (let file of four_pdf_in_page) {
            if (file.file_name === "small-pdf-1.pdf") {
                await scisoorInner(file.buf, four, 55, 47, 490, 765)
            } else {
                await scisoorInner(file.buf, four, 55, 47, 490, 765)
            }
        }

        for (let filei in four) {
            four_pdf_in_page[filei].buf = four[filei]
        }
    }

    for (let fileI in four_pdf_in_page) {
        let file = four_pdf_in_page[fileI]
        logger.info(
            `Cutting label of 4 pages Current ${fileI} of ${four_pdf_in_page.length} AIrway Bills Number ${pdfBuffers.length}`,
        )

        let pdfTempFolder = path.resolve(tempDir, "pdfs")
        let fpath = path.resolve(tempDir, "temp23.pdf")
        let spath = path.resolve(tempDir, "splitted.pdf")
        let execPath = path.resolve("./bins/mutool.exe")
        try {
            fs.writeFileSync(fpath, file.buf)

            execSync(`${execPath} poster -x 2 -y 2 ${fpath} ${spath}`)

            await fsp.mkdir(pdfTempFolder)
            await poppler.pdfSeparate(`${spath}`, path.join(pdfTempFolder, "small-pdf-%d.pdf"))

            for (let fname of fs.readdirSync(pdfTempFolder)) {
                pdfBuffers.push(fs.readFileSync(path.join(pdfTempFolder, fname)))
            }
        } catch (e) {
            logger.info("ERR", e)
        } finally {
            await fsp.rm(pdfTempFolder, { recursive: true }).catch((e) => undefined)
            await fsp.rm(spath).catch((e) => undefined)
            await fsp.rm(fpath).catch((e) => undefined)
        }
    }

    return pdfBuffers
}

async function scisoorInner(file, pdfBuffers, x: number, y: number, w: number, h: number) {
    let exec = path.resolve("./bins/gs.exe")
    let src = path.resolve(tempDir, `tmp_src.pdf`)
    fs.writeFileSync(src, file)

    let dest = path.resolve(tempDir, `tmp_dest.pdf`)
    let cmd = `${exec}  -o ${dest} -sDEVICE=pdfwrite  -c "[/CropBox [${x}  ${y} ${x + w} ${
        y + h
    }] /PAGES pdfmark"  -f ${src}`

    // logger.info(cmd)
    execSync(cmd)
    pdfBuffers.push(fs.readFileSync(dest))
    await fsp.rm(src).catch((e) => undefined)
    await fsp.rm(dest).catch((e) => undefined)
}
