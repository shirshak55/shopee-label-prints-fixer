<script lang="ts">
    export let buttonDetails = { name: "name", text: "Name", isOn: false, count: 0 }
    export let handleClick = (...a: any) => console.log(a)
</script>

<div class="relative flex items-center justify-between">
    <label for="toggle">{buttonDetails.text} - {buttonDetails.count}</label>

    <div class="flex flex-col justify-between ">
        {#if buttonDetails.isOn}
            <span
                on:click={() => handleClick(buttonDetails.name)}
                class="border rounded-full border-gray-400 flex items-center cursor-pointer w-12 bg-green-400 justify-end"
            >
                <span
                    class="rounded-full border w-6 h-6 border-gray-400 shadow-inner bg-white shadow"
                />
            </span>
        {/if}
        {#if !buttonDetails.isOn}
            <span
                on:click={() => handleClick(buttonDetails.name)}
                class="border rounded-full border-gray-400 flex items-center cursor-pointer w-12 justify-start"
            >
                <span
                    class="rounded-full border w-6 h-6 border-gray-400 shadow-inner bg-white shadow"
                />
            </span>
        {/if}
    </div>
</div>
