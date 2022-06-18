import { PNG } from "pngjs";
import fs from "fs";
import path from "path";
import scanner from "jsqr";
async function check_if_qr_code_works_on_pesky_image() {
    let tmpImg = path.resolve("C:\\Users\\user\\AppData\\Local\\Temp\\shopeeLabelPrinter\\temp.png");
    const buffer = fs.readFileSync(tmpImg);
    const png = PNG.sync.read(buffer);
    const code = scanner(Uint8ClampedArray.from(png.data), png.width, png.height);
    console.log(code);
}
check_if_qr_code_works_on_pesky_image().catch((e) => console.log("Err on main", e));
//# sourceMappingURL=test.js.map