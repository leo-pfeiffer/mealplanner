<template>
    <div id="app" class="flex flex-col justify-center items-center text-amber-700 font-comic-sans h-screen overflow-x-scroll">
      <div class="border border-amber-50 my-4 mx-8">
        <div class="justify-items-center px-6 py-4 bg-white border border-amber-200 rounded-lg shadow">
          <h1 class="text-2xl mb-4">Login</h1>
          <form @submit.prevent="login" class="flex flex-col space-y-4">
            <input type="text" v-model="username" placeholder="Username" class="mx-1 bg-transparent hover:bg-amber-500 text-amber-700 font-semibold hover:text-white py-2 px-4 border border-amber-500 hover:border-transparent rounded"/>
            <input type="password" v-model="password" placeholder="Password" class="mx-1 bg-transparent hover:bg-amber-500 text-amber-700 font-semibold hover:text-white py-2 px-4 border border-amber-500 hover:border-transparent rounded"/>
            <button type="submit" class="justify-items-center bg-transparent hover:bg-amber-500 text-amber-700 font-semibold hover:text-white py-2 px-4 border border-amber-500 hover:border-transparent rounded">
              <SmallSpinner v-if="loggingIn"></SmallSpinner>
              <span v-else>Login</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  import SmallSpinner from './components/SmallSpinner.vue';

  const username = ref('')
  const password = ref('')
  const loggingIn = ref(false)
  
  const login = async () => {
    loggingIn.value = true
    const validLogin = await useLogin().login(username.value, password.value)
    if (validLogin) {
      username.value = ''
      password.value = ''
      navigateTo('/')
    } else {
        alert('Invalid credentials')
        username.value = ''
        password.value = ''
        loggingIn.value = false
    }
  }
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