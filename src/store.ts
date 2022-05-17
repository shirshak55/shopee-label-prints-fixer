import { writable } from "svelte/store"

const store = () => {
    const state = {
        input: "",
        output: "",
        indexPath: "",
        openOnceDone: true,
        isRunning: false,
        labels: [{ name: "useless", text: "", isOn: false, count: 0 }],
    }

    const { subscribe, set, update } = writable(state)

    const methods = {
        init() {
            update((state) => {
                let data = localStorage?.getItem("form")
                if (data) {
                    return JSON.parse(data)
                } else {
                    state.input = `C:\\Users\\user\\Desktop\\projects\\shopee-printer\\Shopee TW Order`
                    state.output = `C:\\Users\\user\\Desktop\\projects\\shopee-printer\\Shopee TW Order`
                    state.indexPath = `C:\\Users\\user\\Desktop\\projects\\shopee-printer\\Shopee TW Order`
                    state.labels = [
                        { name: "711", text: "Sevenoneone", isOn: true, count: 0 },
                        { name: "family", text: "Family", isOn: true, count: 0 },
                        { name: "okmart", text: "Okmart", isOn: true, count: 0 },
                        { name: "lai", text: "Lai", isOn: true, count: 0 },
                    ]
                }
                return state
            })
        },
    }

    return {
        subscribe,
        set,
        update,
        ...methods,
    }
}

export default store()
