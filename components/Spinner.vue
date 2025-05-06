<template>
    <div>
        <Teleport to="body">
            <div class="absolute left-0 top-1/3 w-full flex justify-center align-middle">
                <div
                    class="py-3 px-6 border h-max shadow-lg bg-white border-zinc-300 rounded z-50 inline-flex items-center">
                    <SmallSpinner></SmallSpinner>
                    <span class="text-xs font-medium text-zinc-900">{{text}}</span>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script>
import SmallSpinner from './components/SmallSpinner.vue';

export default {
props: {
    text: String
},
}
</script>