<script lang="ts">
    import type { OrderDetail } from "./App.svelte"

    export let details: Array<OrderDetail>
</script>

<div>
    <div class="bg-white">
        <div class="mt-7 overflow-x-auto">
            <table class=" whitespace-nowrap w-full">
                <tbody>
                    <tr class="focus:outline-none h-16 border border-gray-100 rounded bg-gray-200">
                        <td> <div class="ml-5">Type</div> </td>
                        <td class=""> Order Number (Total: {details.length}) </td>
                        <td class=""> Index </td>
                        <td class=""> Type </td>
                    </tr>

                    {#each details as detail (detail.order_id)}
                        <tr class="focus:outline-none h-16 border border-gray-100 rounded">
                            <td>
                                <div class="ml-5">
                                    <div
                                        class="bg-gray-200 rounded-sm w-5 h-5 flex flex-shrink-0 justify-center items-center relative"
                                    >
                                        <input
                                            placeholder="checkbox"
                                            type="checkbox"
                                            class="focus:opacity-100 checkbox opacity-0 absolute cursor-pointer w-full h-full"
                                        />
                                        <div class="check-icon hidden bg-indigo-700 text-white rounded-sm">
                                            <svg
                                                class="icon icon-tabler icon-tabler-check"
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="20"
                                                height="20"
                                                viewBox="0 0 24 24"
                                                stroke-width="1.5"
                                                stroke="currentColor"
                                                fill="none"
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                            >
                                                <path stroke="none" d="M0 0h24v24H0z" />
                                                <path d="M5 12l5 5l10 -10" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td class="">
                                <div class="flex items-center pl-5">
                                    <p class="text-base font-medium leading-none text-gray-700 mr-2">
                                        {detail.order_id}
                                    </p>
                                </div>
                            </td>
                            <td class="pl-24">
                                <div class="flex items-center">
                                    <p class="text-sm leading-none text-gray-600 ml-2">
                                        {detail.index}
                                    </p>
                                </div>
                            </td>

                            <td class="pl-24">
                                <div class="flex items-center">
                                    <p class="text-sm leading-none text-gray-600 ml-2">
                                        {detail.type}
                                    </p>
                                </div>
                            </td>
                        </tr>{/each}
                </tbody>
            </table>
        </div>
    </div>
</div>
