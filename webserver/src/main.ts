import { execSync } from "child_process"
import cors from "cors"
import express, { json, urlencoded } from "express"
import fs from "fs"
import fsp from "fs/promises"
import http from "http"
import path from "path"
import { makePdf, order_details, Vendor } from "./print.js"
import { logger } from "./log.js"
export async function webserver() {
    let httpapp = express()
    httpapp.use(urlencoded({ extended: false }))
    httpapp.use(json())
    httpapp.use(cors())
    httpapp.use(express.static(path.resolve("web/build")))

    httpapp.post("/details", async (req, res) => {
        let indexPath = req.body.indexPath
        let sourceFolderPath = req.body.sourcePath

        let sourceFolderDetails = {}

        if (
            sourceFolderPath &&
            fs.existsSync(sourceFolderPath) &&
            (sourceFolderPath.includes("printer") || sourceFolderPath.includes("ource"))
        ) {
            for (let dirName of await fsp.readdir(sourceFolderPath)) {
                let fcount = await fsp.readdir(path.join(sourceFolderPath, dirName)).catch((e) => [])
                sourceFolderDetails[dirName] = fcount.length
            }
        }

        if (req.body.indexPath) {
            return res.json({
                order_details: await order_details(indexPath).catch((e) => ({
                    error: "Invalid input file or excel file",
                })),
                sourceFolderDetails,
                current_folder: path.resolve("."),
            })
        }
        return res.json({ error: "Invalid input no index path supplied" })
    })

    httpapp.post("/clear_dir", async (req, res) => {
        let dirs = req.body.dirs
        let source = req.body.source

        if ((source && source.includes("print")) || (source.includes("source") && dirs.length && dirs.length >= 1)) {
            for (let dir of dirs) {
                let pth = path.join(source, dir)

                for (let ddd of await fsp.readdir(pth)) {
                    let ppp = path.join(pth, ddd)
                    logger.info("DELETING", ppp)

                    await fsp.rm(ppp).catch((e) => undefined)
                }
            }
        }
        return res.json({ message: "Done" })
    })

    httpapp.post("/exec_shell", async (req, res) => {
        let command = req.body.shell

        try {
            let dd = execSync(command)
            fsp.appendFile("errors.log", dd.toString())

            return res.end(dd.toString())
        } catch (e) {
            fsp.appendFile("errors.log", e)
            return res.end(e)
        }
    })

    httpapp.post("/print", async (req, res) => {
        let input = req.body.input
        let output = req.body.output
        let indexPath = req.body.indexPath
        let openOnceDone = req.body.openOnceDone

        let inputLabelDirectoryExists = fs.existsSync(input)
        let outputDirExists = fs.existsSync(output)
        let indexExists = fs.existsSync(indexPath)

        if (!inputLabelDirectoryExists || !outputDirExists || !indexExists) {
            return res.json({ has_errors: true, errors: { inputLabelDirectoryExists, outputDirExists, indexExists } })
        }

        let results = []
        if (input && output && indexPath && req.body.labels && req.body.labels.length >= 1) {
            let printPdf = async (vendor) => results.push(await makePdf(vendor, input, output, indexPath, openOnceDone))

            for (let vendor of req.body.labels.filter((v) => v.isOn === true)) {
                if (vendor.name === "711") {
                    await printPdf(Vendor.Sevenoneone)
                }

                if (vendor.name === "family") {
                    await printPdf(Vendor.Family)
                }

                if (vendor.name === "okmart") {
                    await printPdf(Vendor.Okmart)
                }

                if (vendor.name === "lai") {
                    await printPdf(Vendor.Lai)
                }
            }
        }
        res.json(results)
    })

    return http.createServer(httpapp).listen(8525, () => {
        logger.info("Server is listening on http://localhost:8525")
    })
}

webserver().catch((e) => logger.info("Error on server", e))
