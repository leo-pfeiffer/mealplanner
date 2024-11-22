<template>
    <div id="app" class="flex flex-col justify-center items-center text-amber-700 font-comic-sans h-screen overflow-x-scroll">
        <div class="border border-amber-50 my-4 mx-8">
        <div class="px-6 py-4 bg-white border border-amber-200 rounded-lg shadow">
            <h1 class="text-2xl mb-4">Error {{ error.statusCode }}</h1>
            <p class="text-lg">
                <span v-if="error.statusCode == 404">
                    Oh no! Looks like you wandered off the path... 🐾😿
                </span>
                <span v-else-if="error.statusCode == 401">
                    Oh no! You're not allowed in... 🚫😿
                </span>
                <span v-else>
                    Oh no! Something went wrong... 😿
                </span>
            </p>
            <button @click="handleError" class="my-4 bg-transparent hover:bg-amber-500 text-amber-700 font-semibold hover:text-white py-2 px-4 border border-amber-500 hover:border-transparent rounded">
                Go back home
            </button>
        </div>
        </div>
    </div>
</template>
<script setup>
const error = useError();

const handleError = () => clearError({ redirect: '/' })
</script>
<style scoped>
#app {
  background-color: #fdf6e3; /* Light yellowish background */
  background-image: 
    linear-gradient(to bottom, transparent 1.9em, #dcdcdc 2em), /* Horizontal lines */
    linear-gradient(to right, #ff6347 0.5em, transparent 0.5em); /* Red margin line */
  background-size: 100% 2em, 100% 100%; /* Repeat horizontal lines every 2em */
  margin: 0;
  font-family: Arial, sans-serif;
}
</style>