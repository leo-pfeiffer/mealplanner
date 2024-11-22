<template>
    <div id="app" class="flex flex-col justify-center items-center text-amber-700 font-comic-sans h-screen overflow-x-scroll">
      <div class="border border-amber-50 my-4 mx-8">
        <div class="px-6 py-4 bg-white border border-amber-200 rounded-lg shadow">
          <h1 class="text-2xl mb-4">Error 404</h1>
          <p class="text-lg">Oh no! Looks like you wandered off the path... 🐾😿</p>
        </div>
      </div>
    </div>
  </template>
  
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