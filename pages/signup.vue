<template>
    <div id="app" class="flex flex-col justify-center items-center text-amber-700 font-comic-sans h-screen overflow-x-scroll">
      <div class="border border-amber-50 my-4 mx-8">
        <div class="justify-items-center px-6 py-4 bg-white border border-amber-200 rounded-lg shadow">
          <h1 class="text-2xl mb-4">Sign up</h1>
          <form @submit.prevent="signup" class="flex flex-col space-y-4">
            <input type="email" v-model="email" placeholder="Email" class="mx-1 bg-transparent hover:bg-amber-500 text-amber-700 font-semibold hover:text-white py-2 px-4 border border-amber-500 hover:border-transparent rounded"/>
            <input type="password" v-model="password" placeholder="Password" class="mx-1 bg-transparent hover:bg-amber-500 text-amber-700 font-semibold hover:text-white py-2 px-4 border border-amber-500 hover:border-transparent rounded"/>
            <input type="password" v-model="confirmPassword" placeholder="Confirm password" class="mx-1 bg-transparent hover:bg-amber-500 text-amber-700 font-semibold hover:text-white py-2 px-4 border border-amber-500 hover:border-transparent rounded"/>
            <p v-if="errorMessage" class="text-red-600 text-sm">{{ errorMessage }}</p>
            <button type="submit" class="justify-items-center bg-transparent hover:bg-amber-500 text-amber-700 font-semibold hover:text-white py-2 px-4 border border-amber-500 hover:border-transparent rounded">
              <SmallSpinner v-if="signingUp"></SmallSpinner>
              <span v-else>Sign up</span>
            </button>
          </form>
          <p class="mt-4 text-sm">
            Already have an account?
            <NuxtLink to="/login" class="underline hover:text-amber-500">Log in</NuxtLink>
          </p>
        </div>
      </div>
    </div>
  </template>

  <script setup>
  import { ref } from 'vue'
  import SmallSpinner from './components/SmallSpinner.vue';

  const email = ref('')
  const password = ref('')
  const confirmPassword = ref('')
  const signingUp = ref(false)
  const errorMessage = ref('')

  const signup = async () => {
    errorMessage.value = ''

    if (password.value !== confirmPassword.value) {
      errorMessage.value = 'Passwords do not match'
      return
    }

    signingUp.value = true
    const result = await useLogin().signup(email.value, password.value)
    if (result.success) {
      email.value = ''
      password.value = ''
      confirmPassword.value = ''
      navigateTo('/login?registered=1')
    } else {
        errorMessage.value = result.error || 'Signup failed'
        signingUp.value = false
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
