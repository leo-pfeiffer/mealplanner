<template>
    <div id="app" class="flex flex-col justify-between text-amber-700 font-comic-sans h-screen overflow-x-scroll">
  
      <div class="border border-amber-50 my-4 mx-8">
        <div class="px-2 py-2 bg-white border border-amber-200 rounded-lg shadow">
          <div class="flex flex-wrap py-2">
            <div class="py-1 px-4">
              <label>
                <button @click="createEmptyMealplanForm" class="bg-transparent hover:bg-amber-500 text-amber-700 font-semibold hover:text-white py-1 px-4 border border-amber-500 hover:border-transparent rounded">
                New meal plan
                </button>
              </label>
            </div>
            <div class="py-1 px-4">
              <button @click="loadExistingMealplan" class="bg-transparent hover:bg-amber-500 text-amber-700 font-semibold hover:text-white py-1 px-4 border border-amber-500 hover:border-transparent rounded">
                Load meal plan
              </button>
              <select class="ml-2 py-1 px-4 border border-amber-500 rounded" v-model="currentMealplanId">
                <option disabled selected value> -- select meal plan -- </option>
                <option v-for="mealplan in mealplans" :key="mealplan.id" :value="mealplan.id" default="Fsa">{{ mealplan.name }}</option>
              </select>
            </div>
            <div class="py-1 px-4">
              <button @click="resetApp" class="bg-transparent hover:bg-amber-500 text-amber-700 font-semibold hover:text-white py-1 px-4 border border-amber-500 hover:border-transparent rounded">
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
  
      <div class="grid three-col flex-grow justify-center items-center mb-auto">
  
        <div id="left-col" class="h-full px-8">
  
          <div class="h-full p-6 bg-white border border-amber-200 rounded-lg shadow">
            <div>

              <p class="m-1 text-xl">Recipes</p>
              <div class="inline-flex items-center">

                <button @click="openCreateRecipeModal()" class="bg-transparent hover:bg-amber-500 text-amber-700 font-semibold hover:text-white py-1 px-4 border border-amber-500 hover:border-transparent rounded">
                  Create recipe
                </button>

                <button v-if="canEditRecipe()" @click="openEditRecipeModal" class=" ml-2 bg-transparent hover:bg-amber-500 text-amber-700 font-semibold hover:text-white py-1 px-4 border border-amber-500 hover:border-transparent rounded">
                  Edit
                </button>
  
              </div>
            </div>
  
            <div v-if="recipes" class="h-80 overflow-x-scroll border border-amber-300 my-2 p-2">
                <div v-for="recipe in recipes" :key="recipe.id">
                  <label class="inline-flex items-center">
                    <input type="checkbox" :value="recipe" v-model="selectedRecipes" class="form-checkbox">
                    <span class="ml-2">{{ recipe.name }}</span>
                  </label>
                </div>
              </div>
            </div>
        </div>
  
        <div id="middle-col" class="flex justify-center items-center">
  
          <!-- Add button -->
          <button @click="addToMealplan" class="block add-button bg-white hover:bg-amber-500 text-amber-700 font-semibold hover:text-white py-2 px-4 border border-amber-500 hover:border-transparent rounded">
            >
          </button>
  
        </div>
  
        <div id="right-col" class="h-full px-8">
  
          <!-- Add button -->
          <div class="block p-6 bg-white border border-amber-200 rounded-lg shadow h-full">
            <p class="m-1 text-xl italic"> {{ newMealplanName }}</p>
  
            <div v-if="newMealplanName == '' && !hasLoadedMealplan" class="inline-flex items-center">
              <p> Create a new mealplan or load an existing one!</p>
            </div>

            <div v-else>

              <div class="mt-4">
                <span class="ml-2">Name:</span>
                <input type="text" v-model="updatedMealplanName" @input="updateMealplanNameInput" class="ml-4 max-h-60 overflow-x-scroll border border-amber-200 rounded p-2"/>
              </div>
  
              <div class="mt-4">
                <span class="ml-2">Recipes:</span>
                <ul v-if="mealplanRecipes.length > 0" class="list-disc ml-4 max-h-60 overflow-x-scroll border border-amber-200 rounded p-2">
                  <li v-for="recipe in mealplanRecipes" class="pb-2">
                    {{ recipe.name }}
                    <ul class="list-disc ml-10">
                      <li v-if="recipe.recipe_ingredients" v-for="ingredient in recipe.recipe_ingredients" class="">
                        {{ ingredient.name }}
                      </li>
                    </ul>
                  </li>
                </ul>
                <p v-else class="ml-4 text-amber-700">Select recipes on the left!</p>
              </div>

              <div class="mt-4 w-full">
                <span class="ml-2">Ingredients:</span>
                <ul class="list-disc ml-4 max-h-60 overflow-x-scroll border border-amber-200 rounded p-2">
                  <li>
                    <input type="text" v-model="mealplanIngredientToAdd" @keyup.enter="addNewIngredientToNewMealplan" class="max-h-60 overflow-x-scroll border border-amber-200 rounded"/>
                    <button @click="addNewIngredientToNewMealplan" class="ml-1 border border-amber-200 rounded px-4">
                      +
                    </button>
                  </li>
                  <li v-for="ingredient in mealplanIngredients">
                    <span @click="removeIngredientFromNewMealplan(ingredient)" class="cursor-pointer">🗑️</span> {{ ingredient }}
                  </li>
                </ul>
              </div>
              
              <button 
              @click="createMealPlan" v-if="!mealplanIsSaved" :class="mealplanIsSaved ? 'hover:cursor-not-allowed' : 'hover:cursor-pointer'" class="ml-4 mt-4 bg-transparent hover:bg-amber-500 text-amber-700 font-semibold hover:text-white py-1 px-4 border border-amber-500 hover:border-transparent rounded">
                Save
              </button>
              <button 
              @click="copyMealplan(currentMealplanId)" v-if="mealplanIsSaved" :class="!mealplanIsSaved ? 'hover:cursor-not-allowed' : 'hover:cursor-pointer'" class="ml-4 mt-4 bg-transparent hover:bg-amber-500 text-amber-700 font-semibold hover:text-white py-1 px-4 border border-amber-500 hover:border-transparent rounded">
                Copy
              </button>
              <button 
              @click="deleteMealplan(currentMealplanId)" v-if="currentMealplanId" class="ml-4 mt-4 bg-transparent hover:bg-amber-500 text-amber-700 font-semibold hover:text-white py-1 px-4 border border-amber-500 hover:border-transparent hover:cursor-pointer rounded">
                Delete
              </button>
              <button 
              @click="sendAsEmail(currentMealplanId)" v-if="currentMealplanId && mealplanIsSaved" :class="!mealplanIsSaved ? 'hover:cursor-not-allowed' : 'hover:cursor-pointer'" class="ml-4 mt-4 bg-transparent hover:bg-amber-500 text-amber-700 font-semibold hover:text-white py-1 px-4 border border-amber-500 hover:border-transparent rounded">
              ✉️ Send as e-mail
              </button>
  
            </div>

            <div class="mt-4" v-if="mealplanMessage != ''">
              <p class="text-blue-500">{{ mealplanMessage }}</p>
            </div>
          </div>
        </div>
  
      </div>
  
      <div class="border border-amber-50 mx-8 my-4">
        <!-- <footer class="px-6 py-2 bg-white border border-amber-200 rounded-lg shadow">
          This is a footer
        </footer> -->
      </div>

      <Modal :show="isRecipeEditModalVisible" @close="isRecipeEditModalVisible = false">

        <div class="w-full">
          <h2 class="text-xl font-bold">{{ editRecipeOriginalName }}</h2>

          <div class="mt-4 w-full">
            <span class="ml-2">Name:</span>
            <input type="text" v-model="editRecipeName" @input="checkEditRecipeNameConflict" class="w-full ml-4 max-h-60 overflow-x-scroll border border-amber-200 rounded p-2"/>
            <span class="text-red-500" v-if="editRecipeNameMessage != ''"> {{ editRecipeNameMessage }}</span>
          </div>

          <div class="grid grid-cols-2">
            <div class="mt-4 w-full">
              <span class="ml-2">Ingredients:</span>
              <ul class="list-disc ml-4 max-h-60 overflow-x-scroll border border-amber-200 rounded p-2">
                <li>
                  <input type="text" v-model="editRecipeIngredientToAdd" @keyup.enter="addNewRecipeIngredientToEditRecipe" class="max-h-60 overflow-x-scroll border border-amber-200 rounded"/>
                  <button @click="addNewRecipeIngredientToEditRecipe" class="ml-1 border border-amber-200 rounded px-4">
                    +
                  </button>
                </li>
                <li v-for="ingredient in editRecipeIngredients">
                  <span @click="removeIngredientFromEditRecipe(ingredient)" class="cursor-pointer">🗑️</span> {{ ingredient }}
                </li>
              </ul>
            </div>

            <div class="mt-4 w-full">
              <span class="ml-2">Note:</span>
              <textarea v-model="editRecipeNote" class="w-full ml-4 min-h-40 max-h-60 overflow-x-scroll border border-amber-200 rounded p-2"></textarea>
            </div>
          </div>

          <div class="mt-4" v-if="modalMessage != ''">
            <p class="text-blue-500">{{ modalMessage }}</p>
          </div>

          <div class="mt-4">
            <button @click="saveEditedRecipe" class="mx-2 bg-transparent hover:bg-amber-500 text-amber-700 font-semibold hover:text-white py-1 px-4 border border-amber-500 hover:border-transparent rounded">
              Save
            </button>
            <button @click="copyRecipe(editRecipeId)" class="mx-2 bg-transparent hover:bg-amber-500 text-amber-700 font-semibold hover:text-white py-1 px-4 border border-amber-500 hover:border-transparent rounded">
              Copy
            </button>
            <button @click="deleteRecipe(editRecipeId)" class="mx-2 bg-transparent hover:bg-amber-500 text-amber-700 font-semibold hover:text-white py-1 px-4 border border-amber-500 hover:border-transparent rounded">
              Delete
            </button>
            <button @click="isRecipeEditModalVisible = false" class="mx-2 bg-transparent hover:bg-amber-500 text-amber-700 font-semibold hover:text-white py-1 px-4 border border-amber-500 hover:border-transparent rounded">
              Close
            </button>
          </div>
        </div>

      </Modal>
  
    </div>
  
</template>
    
<script setup>  
  import { ref } from 'vue';
  import Modal from './components/Modal.vue';

  definePageMeta({
    middleware: 'auth'
  });
  
  const selectedRecipes = ref([]);
  const selectedIngredients = ref([]);

  const fetchRecipe = await useFetch('/api/recipe');
  const fetchMealplans = await useFetch('/api/mealplan');
  
  const recipes = ref(fetchRecipe.data);
  const refresh_recipes = () => {
    fetchRecipe.refresh();
    selectedRecipes.value = [];
  };
  
  const mealplans = ref(fetchMealplans.data);
  const refresh_mealplans = fetchMealplans.refresh;
  
  const newMealplanName = ref('');
  const updatedMealplanName = ref('');
  const mealplanIngredientToAdd = ref('');
  const mealplanIngredients = ref([]);
  const mealplanRecipes = ref([]);
  const loadedMealplan = ref({});
  const currentMealplanId = ref('');
  const hasLoadedMealplan = ref(false);
  const mealplanMessage = ref('');
  const mealplanIsSaved = ref(false);

  const editRecipeId = ref('');
  const editRecipeOriginalName = ref('');
  const editRecipeName = ref('');
  const editRecipeNote = ref('');
  const editRecipeIngredients = ref([]);
  const editRecipeNameMessage = ref('');
  const editRecipeIngredientToAdd = ref('');
  
  const isRecipeEditModalVisible = ref(false);
  
  const modalMessage = ref('');
  
  const manageMealPlanStatus = ref('');
  const manageRecipeStatus = ref('');

  const canEditRecipe = () => {
    return selectedRecipes.value.length == 1;
  }

  const getSingleSelectedRecipe = () => {
    return selectedRecipes.value.length == 1 ? selectedRecipes.value[0] : null;
  }
  
  const openEditRecipeModal = () => {
    isRecipeEditModalVisible.value = true;
    const selected = getSingleSelectedRecipe();
    editRecipeId.value = selected.id;
    editRecipeOriginalName.value = selected.name;
    editRecipeName.value = selected.name;
    editRecipeNote.value = selected.note;
    editRecipeIngredients.value = selected.recipe_ingredients.map(i => i.name);
  }

  const clearEditRecipe = () => {
    editRecipeId.value = null;
    editRecipeOriginalName.value = null;
    editRecipeName.value = null;
    editRecipeNote.value = null;
    editRecipeIngredients.value = [];
    editRecipeIngredientToAdd.value = null;
  }

  const openCreateRecipeModal = () => {
    isRecipeEditModalVisible.value = true;
    clearEditRecipe()
  }

  const updateMealplanNameInput = () => {
    if (newMealplanName.value !== updatedMealplanName.value) {
      mealplanIsSaved.value = false;
    }
  }

  const removeIngredientFromEditRecipe = (ingredient) => {
    editRecipeIngredients.value = editRecipeIngredients.value.filter(ing => ing != ingredient);
  }

  const removeIngredientFromNewMealplan = (ingredient) => {
    mealplanIngredients.value = mealplanIngredients.value.filter(ing => ing != ingredient);
  }

  const addNewIngredientToNewMealplan = () => {
    const clean = stripAndUseStandardCapitalization(mealplanIngredientToAdd.value);
    if (!clean || clean == '') {
      mealplanIngredientToAdd.value = '';
      return;
    };
    if (!mealplanIngredients.value.includes(clean)) {
      mealplanIngredients.value = [clean, ...mealplanIngredients.value];
    }
    mealplanIngredientToAdd.value = '';
    mealplanIsSaved.value = false;
  }

  const addNewRecipeIngredientToEditRecipe = () => {
    const clean = stripAndUseStandardCapitalization(editRecipeIngredientToAdd.value);
    if (!clean || clean == '') {
      editRecipeIngredientToAdd.value = '';
      return;
    };
    if (!editRecipeIngredients.value.includes(clean)) {
      editRecipeIngredients.value = [clean, ...editRecipeIngredients.value];
    }
    editRecipeIngredientToAdd.value = '';
  }

  const stripAndUseStandardCapitalization = (string) => {
    return string.trim().toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }
  
  const addToMealplan = () => {
    mealplanRecipes.value = [...selectedRecipes.value.sort((a, b) => a.name.localeCompare(b.name))];
    mealplanIsSaved.value = false;
  }
  
  const createRecipeApi = async (recipeName, note, ingredients, recipeId) => {
    const body = {
      name: recipeName,
      ingredients: ingredients,
      note: note
    }

    if (recipeId) {
      body.id = recipeId;
      body.fieldsToUpdate = ['name', 'note', 'ingredients'];
    }

    return fetch('/api/recipe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
  }

  const saveEditedRecipe = async () => {
    if (!editRecipeName.value || editRecipeIngredients.value.length == 0) {
      setMessageWithTimer(modalMessage, 'Recipe name or ingredients missing');
      return;
    }
    const response = await createRecipeApi(
      editRecipeName.value, 
      editRecipeNote.value, 
      editRecipeIngredients.value,
      editRecipeId.value
    );
    if (response.ok) {
      setMessageWithTimer(modalMessage, 'Recipe saved!', 10000);
      clearEditRecipe();
      refresh_recipes();
      selectedRecipes.value = [];
    } else {
      setMessageWithTimer(modalMessage, 'Could not save recipe');
    }
  }
  
  const loadExistingMealplan = () => {
    if (!currentMealplanId.value) {
      return;
    }
    loadedMealplan.value = mealplans.value.find(m => m.id == currentMealplanId.value);
    hasLoadedMealplan.value = true;
  
    // load mealplan into mealplanIngredients and mealplanRecipes
    newMealplanName.value = loadedMealplan.value.name;
    updatedMealplanName.value = loadedMealplan.value.name;
    currentMealplanId.value = loadedMealplan.value.id;
  
    mealplanIngredients.value = [...loadedMealplan.value.mealplan_ingredients.map(i => i.name)];
    mealplanRecipes.value = [...loadedMealplan.value.mealplan_recipes];

    mealplanIsSaved.value = true;
  }

  const resetMealplanForm = () => {
    newMealplanName.value = '';
    updatedMealplanName.value = '';
    hasLoadedMealplan.value = false;
    loadedMealplan.value = {};
    mealplanIngredients.value = [];
    mealplanRecipes.value = [];
    currentMealplanId.value = null;
  }
  
  const resetApp = () => {
    resetMealplanForm();
    selectedRecipes.value = [];
    selectedIngredients.value = [];
  }
  
  const createEmptyMealplanForm = () => {
    newMealplanName.value = null;
    updatedMealplanName.value = null;
    hasLoadedMealplan.value = false;
    loadedMealplan.value = {};
    currentMealplanId.value = null;
    mealplanRecipes.value = [];
    mealplanIngredients.value = [];
    mealplanIsSaved.value = false;
  }
  
  const createMealplanApi = async (mealplanId, name, ingredients, recipes) => {
    return fetch('/api/mealplan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id: mealplanId, name: name, ingredients: ingredients, recipes: recipes })
    })
  }
  
  const createMealPlan = async () => {
    if (!updatedMealplanName.value) {
      setMessageWithTimer(mealplanMessage, 'Mealplan name missing');
      return;
    }
    if (mealplanRecipes.value.length == 0 && mealplanIngredients.value.length == 0) {
      setMessageWithTimer(mealplanMessage, 'Please select either recipes or ingredients');
      return;
    }
    
    await createMealplanApi(
      currentMealplanId.value ? currentMealplanId.value : null,
      updatedMealplanName.value, 
      mealplanIngredients.value, 
      mealplanRecipes.value
    )
    .then(
      res => res.json()
    ).then(
      data => {
        if (data.status === 200) {
          mealplanIsSaved.value = true;
          currentMealplanId.value = data.body.mealplan.id;
          updatedMealplanName.value = data.body.mealplan.name;
          newMealplanName.value = data.body.mealplan.name;
          setMessageWithTimer(mealplanMessage, 'Mealplan saved!');
          refresh_mealplans();
        } else {
          setMessageWithTimer(mealplanMessage, 'Could not save mealplan!');
        }
      }
    )
  }
  
  const checkEditRecipeNameConflict = () => {
    if (recipes.value.find(r => r.name == editRecipeName.value) && editRecipeName.value != editRecipeOriginalName.value) {
      editRecipeNameMessage.value = 'Recipe already exists';
    } else {
      editRecipeNameMessage.value = '';
    }
  }

  const setMessageWithTimer = (field, msg, ms=6000) => {
    field.value = msg;
    setTimeout(() => {
      field.value = '';
    }, ms);
  }

  const updateRecipeName = async (recipeId, e) => {
    const newName = e.target.value.trim();
    if (!newName || newName == ''){
      return
    };
    const response = await fetch('/api/recipe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(
        { 
          id: recipeId, 
          name: newName,
          fieldsToUpdate: ['name']
        }
      )
    })
    if (response.ok) {
      e.target.value = '';
      refresh_recipes();
      setMessageWithTimer(manageRecipeStatus, '✅', 1000);
    } else {
      setMessageWithTimer(manageRecipeStatus, '⚠️', 2000);
    }
  }
  
  const copyMealplan = (mealplanId) => {
    fetch(`/api/mealplan?id=${mealplanId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
    })
    .then(res => res.json())
    .then(
      data => {
        const name = data.name + ' (copy)';
        const ingredients = data.mealplan_ingredients.map(i => i.name);
        const recipes = data.mealplan_recipes;
        return createMealplanApi(
          null,
          name, 
          ingredients, 
          recipes
        );
      }
    ).then(
      res => {
        if (res.ok) {
          refresh_mealplans();
          setMessageWithTimer(mealplanMessage, 'Mealplan copied!');
        } else {
          setMessageWithTimer(mealplanMessage, 'Could not copy mealplan.');
          console.log('Could not copy mealplan');
        }
      }
    );
  }
  
  const copyRecipe = (recipeId) => {
    fetch(`/api/recipe?id=${recipeId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
    }).then(res => res.json())
    .then(
      data => {
        const name = data.name + ' (copy)';
        const note = data.note;
        const ingredients = data.recipe_ingredients.map(i => i.name);
        return createRecipeApi(name, note, ingredients, null);
      }
    ).then(
      res => {
        if (res.ok) {
          refresh_recipes();
          setMessageWithTimer(modalMessage, 'Recipe copied!');
        } else {
          setMessageWithTimer(modalMessage, 'Could not copy recipe.');
          console.log('Could not copy recipe.');
        }
      }
    );
  }

  const deleteRecipe = async (recipeId) => {
    const resp = await fetch(`/api/recipe?id=${recipeId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
    })
    if (resp.ok) {
      refresh_recipes();
      clearEditRecipe();
      setMessageWithTimer(modalMessage, 'Recipe deleted!');
    } else {
      console.log('Could not delete recipe');
      setMessageWithTimer(modalMessage, 'Could not delete recipe');
    }
  }
  
  const deleteMealplan = async (mealplanId) => {
    const resp = await fetch(`/api/mealplan?id=${mealplanId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
    })
    if (resp.ok) {
      refresh_mealplans();
      resetMealplanForm();
      setMessageWithTimer(mealplanMessage, 'Mealplan deleted!');
    } else {
      setMessageWithTimer(mealplanMessage, 'Could not delete mealplan');
      console.log('Could not delete mealplan');
    }
  }

  const sendAsEmail = async (mealplanId) => {
    await fetch(`/api/internal/email?mealplanId=${mealplanId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
    })
    .then(res => res.json())
    .then(data => {
      if (data.status === 200) {
        setMessageWithTimer(mealplanMessage, 'Mealplan sent as email!');
      } else {
        console.log('Could not send mealplan as email');
        setMessageWithTimer(mealplanMessage, 'Could not send mealplan as email');
      }
    });
  }
  
  </script>
  <style>
  .three-col {
    grid-template-columns: 1fr fit-content(40px) 1fr;
  }
  
  .add-button {
    padding-top: 20px;
    padding-bottom: 20px;
    padding-left: 4px;
    padding-right: 4px;
  }
  
  @media only screen and (max-width: 720px) {
    .three-col {
      grid-template-columns: 1fr;
    }
    .add-button {
      padding-top: 20px;
      padding-bottom: 20px;
      padding-left: 4px;
      padding-right: 4px;
      transform: rotate(90deg);
    }
  }
  
  table, th, td {
    border: 1px solid gray;
    border-collapse: collapse;
    padding: 5px;
  }
  
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
  