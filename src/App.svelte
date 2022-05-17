<script context="module" lang="ts">
    export interface OrderDetail {
        order_id: String
        index: Number
        type: String
    }

    export interface Detail {
        order_details: Array<OrderDetail>
        sourceFolderDetails: any
    }
</script>

<script lang="ts">
    import Form from "./Form.svelte"
    import OrderInfo from "./OrderInfo.svelte"
    import store from "./store"
    import { onDestroy, onMount } from "svelte"

    store.init()
    store.subscribe((val: any) => localStorage.setItem("form", JSON.stringify(val)))

    let interval: null | any = null

    let details: Detail = { order_details: [], sourceFolderDetails: [] }

    async function fetchForever() {
        try {
            let json = await fetch("http://localhost:8525/details", {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    indexPath: $store.indexPath,
                    sourcePath: $store.input,
                }),
            }).then((resp) => resp.json())

            if (json.error) {
                store.update((s) => {
                    s.isRunning = false
                    return s
                })
            } else {
                store.update((s) => {
                    s.isRunning = true
                    return s
                })
                details = json

                for (let folder in details.sourceFolderDetails) {
                    let idx = $store.labels.findIndex((v) => v.text === folder)

                    if (idx >= 0) {
                        store.update((state) => {
                            state.labels[idx].count = details.sourceFolderDetails[folder]
                            return state
                        })
                    }
                }
            }
        } catch (e) {
            store.update((s) => {
                s.isRunning = false
                return s
            })
        }
    }

    onMount(async () => {
        fetchForever().catch((e) => console.log("Error on fetching", e))
        interval = setInterval(() => {
            fetchForever().catch((e) => console.log("Err on fetching", e))
        }, 1000)
    })

    onDestroy(async () => {
        if (interval) {
            clearInterval(interval)
        }
    })
</script>

<svelte:head>
    <title>Shopee Airway Printer</title>
</svelte:head>

<main>
    <section>
        <div class="flex justify-center">
            <Form {store} />
        </div>
        <OrderInfo details={details.order_details} />
    </section>
</main>
