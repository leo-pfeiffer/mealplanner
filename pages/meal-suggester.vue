<template>
  <div id="app" class="flex flex-col min-h-screen text-amber-700 font-comic-sans">

    <div class="p-4">
      <div class="px-2 py-2 bg-white border border-amber-200 rounded-lg shadow">
        <div class="flex flex-row py-2 justify-start items-center">
          <div class="min-w-16 mx-4">
            <img src="@/assets/img/logo.png" alt="Logo" class="w-16 h-16"/>
          </div>
          <div class="py-1 px-2">
            <NuxtLink to="/" class="bg-transparent hover:bg-amber-500 text-amber-700 font-semibold hover:text-white py-1 px-4 border border-amber-500 hover:border-transparent rounded">
              Meal Planner
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <div class="flex-1 p-4">
      <div class="p-6 bg-white border border-amber-200 rounded-lg shadow">
        <p class="text-2xl mb-1">What's in My Fridge?</p>
        <p class="mb-4">Enter your ingredients and get meal ideas.</p>

        <textarea
          v-model="ingredients"
          placeholder="e.g. chicken thighs, coconut milk, lemongrass, garlic..."
          class="w-full min-h-24 border border-amber-200 rounded p-2 mb-4"
        ></textarea>

        <button
          @click="suggestMeals"
          :disabled="loading"
          class="bg-transparent hover:bg-amber-500 text-amber-700 font-semibold hover:text-white py-1 px-4 border border-amber-500 hover:border-transparent rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Suggest Meals
        </button>

        <div v-if="loading" class="mt-4 inline-flex items-center ml-4">
          <SmallSpinner></SmallSpinner>
          <span class="text-xs font-medium">Getting meal suggestions...</span>
        </div>

        <div v-if="error" class="mt-4 text-red-500">{{ error }}</div>

        <div v-if="meals.length > 0" class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div v-for="meal in meals" :key="meal.name" class="border border-amber-200 rounded-lg p-4">
            <p class="text-xl font-semibold">{{ meal.name }}</p>
            <p class="text-sm mt-1">{{ meal.cuisine }} &middot; ~{{ meal.cook_time_minutes }} min</p>
            <p class="mt-2 text-sm">{{ meal.description }}</p>
            <div class="mt-3">
              <button
                @click="meal._showSteps = !meal._showSteps"
                class="text-sm bg-transparent hover:bg-amber-500 text-amber-700 font-semibold hover:text-white py-1 px-3 border border-amber-500 hover:border-transparent rounded"
              >
                {{ meal._showSteps ? 'Hide Steps' : 'Show Steps' }}
              </button>
              <ol v-show="meal._showSteps" class="list-decimal ml-5 mt-2 text-sm space-y-1">
                <li v-for="(step, i) in meal.steps" :key="i">{{ step }}</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import SmallSpinner from './components/SmallSpinner.vue'

definePageMeta({ middleware: 'auth' })

const ingredients = ref('')
const loading = ref(false)
const error = ref('')
const meals = ref([])

const suggestMeals = async () => {
  if (!ingredients.value.trim()) return

  loading.value = true
  error.value = ''
  meals.value = []

  try {
    const prompt = "You are a meal planning assistant with a strong preference for suggesting Classic American, Asian, and Mediterranean dishes, though you may suggest others when they are the best fit.\n\n"
      + "ONLY SUGGEST FULLY GLUTEN FREE RECIPES.\n\n"
      + "Always respond with valid JSON only — no markdown formatting, no code fences, no preamble.\n\n"
      + `I have these ingredients: ${ingredients.value}\n\n`
      + "Suggest 3 meals I can make. Assume standard pantry staples (oil, salt, pepper, basic spices) are available even if not listed. You do not necessarily need to use all listed ingredients, but try to use as many as reasonable.\n\n"
      + 'Respond ONLY with this JSON structure:\n'
      + '{\n  "meals": [\n    {\n      "name": "string",\n      "description": "string — 1 to 2 sentences",\n      "cuisine": "string",\n      "cook_time_minutes": number,\n      "steps": ["string", "string", "..."]\n    }\n  ]\n}'

    const raw = await useGemini().generate(prompt)
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()

    let parsed
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      error.value = "Couldn't parse meal suggestions. Please try again."
      return
    }

    meals.value = (parsed.meals || []).map(m => ({ ...m, _showSteps: false }))
  } catch {
    error.value = 'Something went wrong. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
#app {
  background-color: #fdf6e3;
  background-image:
    linear-gradient(to bottom, transparent 1.9em, #dcdcdc 2em),
    linear-gradient(to right, #ff6347 0.5em, transparent 0.5em);
  background-size: 100% 2em, 100% 100%;
  margin: 0;
  font-family: Arial, sans-serif;
}
</style>
