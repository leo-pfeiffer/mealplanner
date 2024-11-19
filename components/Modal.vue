<!-- Modal.vue -->
<template>
<div v-if="show" class="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center">
    <div class="bg-white p-6 rounded-lg shadow-lg relative w-3/4">
    <!-- Close button -->
    <button class="absolute top-2 right-2 text-amber-400" @click="closeModal">✕</button>
    
    <!-- Modal content -->
    <slot></slot>
    </div>
</div>
</template>
  
<script>
export default {
props: {
    show: {
    type: Boolean,
    required: true
    }
},
emits: ['close'],
methods: {
    closeModal() {
    this.$emit('close');
    }
}
};
</script>
