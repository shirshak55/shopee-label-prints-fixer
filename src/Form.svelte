<script lang="ts">
    import type storeType from "./store"
    import { open as openDailog } from "@tauri-apps/api/dialog"
    import { open as openFile } from "@tauri-apps/api/shell"
    export let store: typeof storeType

    import Switch from "./Switch.svelte"

    let submit = "Submit"

    $: message = []

    export let handleLabelSwitchClick = (btnName: string) => {
        let index = $store.labels.findIndex((v: any) => {
            return v.name === btnName
        })

        if (index >= 0) {
            store.update((state) => {
                state.labels[index].isOn = !state.labels[index].isOn
                return state
            })
        }
    }

    async function handleClearSelectedDir() {
        try {
            let json = await fetch("http://localhost:8525/clear_dir", {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    dirs: $store.labels.filter((v) => v.isOn).map((v) => v.text),
                    source: $store.input,
                }),
            }).then((resp) => resp.json())

            alert(json)
        } catch (e) {
            alert("Failed")
        }
    }

    async function handleSubmit() {
        submit = "Loading..."
        try {
            let json = await fetch("http://localhost:8525/print", {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify($store),
            }).then((resp) => resp.json())
            message = []
            message = [...message, `Succesfully Printed:`]

            console.log("Status", json)
            for (let aa of json) {
                message = [...message, `${aa.input.vendor} Stats: ${aa.stats} of ${aa.count}`]
                if ($store.openOnceDone) {
                    if (aa.outputFile && aa.outputFile.length) {
                        console.log("Output file doesn't exists so not opening it", aa)
                        await openFile(aa.outputFile)
                    }
                }
            }
            submit = "Submit"
        } catch (e) {
            submit = "Submit Again"
            console.log("FAILED PRINT BECAUSE OF", e)
            alert(`Failed ${e}`)
        }
    }

    async function inputIndexPath() {
        let path = await openDailog({
            title: "Please choose folder",
            directory: false,
            filters: [{ name: "Excel", extensions: ["xlsx"] }],
            multiple: false,
        })
        console.log("INPUT INDEX PATH", path)
        if (path) {
            store.update((state) => {
                //@ts-ignore
                state.indexPath = path
                return state
            })
        }
    }

    async function inputFolderChooser() {
        let path = await openDailog({ title: "Please choose input folder", directory: true, multiple: false })
        if (path) {
            message = [...message, `Choosed Input Folder to ${path}`]

            store.update((state) => {
                //@ts-ignore
                state.input = path
                return state
            })
        }
    }

    async function outputFolderChooser() {
        let path = await openDailog({ title: "Please choose output folder", directory: true, multiple: false })
        if (path) {
            store.update((state) => {
                //@ts-ignore
                state.output = path
                return state
            })
        }
    }
</script>

<div class="flex flex-col items-start justify-between lg:flex-row">
    <div class="relative z-10 w-full max-w-2xl ">
        <div class="relative z-10 flex flex-col items-start justify-start bg-white shadow-2xl rounded-xl px-10 py-10">
            <h4 class="w-full text-4xl font-medium leading-snug">Print Shopee Airway Bills</h4>
            <div class="relative w-full mt-6 space-y-8">
                <div class="relative">
                    <p>Bot Server Status: {$store.isRunning}</p>
                </div>
                <div class="relative">
                    <label class="absolute px-2 ml-2 -mt-3 font-medium text-gray-600 bg-white" for="input_folder"
                        >Index File Path</label
                    >
                    <div class="flex item-center">
                        <input
                            id="input_folder"
                            type="text"
                            class="block w-full px-4 py-4 mt-2 text-base placeholder-gray-400 bg-white border border-gray-300 rounded-md focus:outline-none focus:border-black"
                            placeholder="Enter path"
                            bind:value={$store.indexPath}
                        />
                        <button class="mx-4" on:click={() => inputIndexPath()}
                            ><svg
                                class="w-5 h-5 mb-3 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                                ><path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                /></svg
                            >
                        </button>
                    </div>
                </div>

                <div class="relative">
                    <label class="absolute px-2 ml-2 -mt-3 font-medium text-gray-600 bg-white" for="input_folder"
                        >Input Folder Path</label
                    >
                    <div class="flex">
                        <input
                            id="input_folder"
                            type="text"
                            class="block w-full px-4 py-4 mt-2 text-base placeholder-gray-400 bg-white border border-gray-300 rounded-md focus:outline-none focus:border-black"
                            placeholder="Enter path"
                            bind:value={$store.input}
                        />

                        <button class="mx-4" on:click={() => inputFolderChooser()}
                            ><svg
                                class="w-5 h-5 mb-3 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                                ><path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                /></svg
                            >
                        </button>
                    </div>
                </div>

                <div class="relative">
                    <label class="absolute px-2 ml-2 -mt-3 font-medium text-gray-600 bg-white" for="export_folder"
                        >Export Folder Path</label
                    >
                    <div class="flex">
                        <input
                            id="export_folder"
                            type="text"
                            class="block w-full px-4 py-4 mt-2 text-base placeholder-gray-400 bg-white border border-gray-300 rounded-md focus:outline-none focus:border-black"
                            placeholder="Enter Path"
                            bind:value={$store.output}
                        />
                        <button class="mx-4" on:click={() => outputFolderChooser()}
                            ><svg
                                class="w-5 h-5 mb-3 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                                ><path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                /></svg
                            >
                        </button>
                    </div>
                </div>

                {#each $store.labels as detail (detail.name)}
                    <Switch buttonDetails={detail} handleClick={handleLabelSwitchClick} />
                {/each}

                <label class="flex justify-start items-start" for="checkboxasdf">
                    <div
                        class="bg-white border-2 rounded border-gray-400 w-6 h-6 flex flex-shrink-0 justify-center items-center mr-2 focus-within:border-blue-500"
                    >
                        <input
                            id="checkboxasdf"
                            type="checkbox"
                            bind:checked={$store.openOnceDone}
                            class="opacity-0 absolute"
                        />
                        <svg class="fill-current hidden w-4 h-4 text-green-500 pointer-events-none" viewBox="0 0 20 20"
                            ><path d="M0 11l2-2 5 5L18 3l2 2L7 18z" /></svg
                        >
                    </div>
                    <div class="select-none">Open PDF once done</div>
                </label>

                <div class="relative">
                    <button
                        on:click={handleSubmit}
                        class="inline-block w-full px-5 py-4 text-xl font-medium text-center text-white transition duration-200 bg-blue-600 rounded-lg hover:bg-blue-500 ease"
                        >{submit}</button
                    >
                </div>

                <div class="relative">
                    <button
                        on:click={handleClearSelectedDir}
                        class="inline-block w-full px-5 py-4 text-xl font-medium text-center text-white transition duration-200 bg-red-600 rounded-lg hover:bg-red-500 ease"
                        >Clear Selected Input Directory</button
                    >
                </div>

                <div class="relative">
                    <div>Message:</div>
                    {#each message as m}
                        <p>{m}</p>
                    {/each}
                    <p />
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    input:checked + svg {
        display: block;
    }
</style>
