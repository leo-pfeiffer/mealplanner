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
              <button @click="loadMealplan(dropdownSelectedMealplanId)" class="bg-transparent hover:bg-amber-500 text-amber-700 font-semibold hover:text-white py-1 px-4 border border-amber-500 hover:border-transparent rounded">
                Load meal plan
              </button>
              <select class="ml-2 py-1 px-4 border border-amber-500 rounded" v-model="dropdownSelectedMealplanId">
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

                <button v-if="selectedRecipes.length == 1" @click="openEditRecipeModal" class=" ml-2 bg-transparent hover:bg-amber-500 text-amber-700 font-semibold hover:text-white py-1 px-4 border border-amber-500 hover:border-transparent rounded">
                  Edit
                </button>
  
              </div>
            </div>

            <div class="mt-2">
                <!-- <span class="ml-2">Search:</span> -->
                <input type="text" v-model="recipeFilter" placeholder="Search by name or tag" class="w-80 max-h-60 overflow-x-scroll border border-amber-200 rounded p-2"/>
            </div>
  
            <div v-if="recipes" class="h-80 overflow-x-scroll border border-amber-300 my-2 p-2">
                <div v-for="recipe in getFilteredRecipes()" :key="recipe.id">
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
          <button @click="addSelectedToMealplan" class="block add-button bg-white hover:bg-amber-500 text-amber-700 font-semibold hover:text-white py-2 px-4 border border-amber-500 hover:border-transparent rounded">
            >
          </button>
  
        </div>
  
        <div id="right-col" class="h-full px-8">
  
          <!-- Add button -->
          <div class="block p-6 bg-white border border-amber-200 rounded-lg shadow h-full">
            <p class="m-1 text-xl italic"> {{ editMealplan.originalName }}</p>
  
            <div v-if="!editMealplan.state" class="inline-flex items-center">
              <p> Create a new mealplan or load an existing one!</p>
            </div>

            <div v-else>

              <div class="mt-4">
                <span class="ml-2">Name:</span>
                <input type="text" v-model="editMealplan.newName" @input="updateMealplanNameInput" class="ml-4 max-h-60 overflow-x-scroll border border-amber-200 rounded p-2"/>
              </div>
  
              <div class="mt-4">
                <span class="ml-2">Recipes:</span>
                <ul v-if="editMealplan.recipes.length > 0" class="list-disc ml-4 max-h-60 overflow-x-scroll border border-amber-200 rounded p-2">
                  <li v-for="recipe in editMealplan.recipes" class="pb-2">
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
                    <input type="text" v-model="editMealplan.newIngredient" @keyup.enter="addNewIngredientToMealplan" class="max-h-60 overflow-x-scroll border border-amber-200 rounded"/>
                    <button @click="addNewIngredientToMealplan" class="ml-1 border border-amber-200 rounded px-4">
                      +
                    </button>
                  </li>
                  <li v-for="ingredient in editMealplan.ingredients">
                    <span @click="removeIngredientFromMealplan(ingredient)" class="cursor-pointer">🗑️</span> {{ ingredient }}
                  </li>
                </ul>
              </div>
              
              <button 
              @click="saveMealplan" v-if="editMealplan.state !== MealplanState.SAVED" class="ml-4 mt-4 bg-transparent hover:bg-amber-500 text-amber-700 font-semibold hover:text-white py-1 px-4 border border-amber-500 hover:border-transparent rounded hover:cursor-pointer">
                Save
              </button>
              <button 
              @click="copyMealplan(editMealplan.mealplanId)" v-if="editMealplan.state === MealplanState.SAVED" class="ml-4 mt-4 bg-transparent hover:bg-amber-500 text-amber-700 font-semibold hover:text-white py-1 px-4 border border-amber-500 hover:border-transparent rounded hover:cursor-pointer">
                Copy
              </button>
              <button 
              @click="deleteMealplan(editMealplan.mealplanId)" v-if="editMealplan.mealplanId" class="ml-4 mt-4 bg-transparent hover:bg-amber-500 text-amber-700 font-semibold hover:text-white py-1 px-4 border border-amber-500 hover:border-transparent hover:cursor-pointer rounded">
                Delete
              </button>
              <button 
              @click="sendAsEmail(editMealplan.mealplanId)" v-if="editMealplan.state === MealplanState.SAVED" class="ml-4 mt-4 bg-transparent hover:bg-amber-500 text-amber-700 font-semibold hover:text-white py-1 px-4 border border-amber-500 hover:border-transparent rounded hover:cursor-pointer">
              ✉️ Send as e-mail
              </button>
  
            </div>

            <div class="mt-4" v-if="editMealplanMessage != ''">
              <p class="text-blue-500">{{ editMealplanMessage }}</p>
            </div>
          </div>
        </div>
  
      </div>
  
      <div class="border border-amber-50 mx-8 my-4">
        <!-- <footer class="px-6 py-2 bg-white border border-amber-200 rounded-lg shadow">
          This is a footer
        </footer> -->
      </div>

      <Modal :show="isEditRecipeModelVisible" @close="isEditRecipeModelVisible = false">

        <div class="w-full">
          <h2 class="text-xl font-bold">{{ editRecipe.originalName }}</h2>

          <div class="mt-4 w-full">
            <span class="ml-2">Name:</span>
            <input type="text" v-model="editRecipe.newName" @input="checkRecipeNameConflict" class="w-full ml-4 max-h-60 overflow-x-scroll border border-amber-200 rounded p-2"/>
            <span class="ml-4 text-red-500" v-if="editRecipeModalNewNameMessage"> {{ editRecipeModalNewNameMessage }}</span>
          </div>

          <div class="grid grid-cols-2">
            <div class="mt-4 w-full">
              <span class="ml-2">Ingredients:</span>
              <ul class="list-disc ml-4 max-h-60 overflow-x-scroll border border-amber-200 rounded p-2">
                <li>
                  <input type="text" v-model="editRecipe.newIngredient" @keyup.enter="addNewIngredientToRecipe" class="max-h-60 overflow-x-scroll border border-amber-200 rounded"/>
                  <button @click="addNewIngredientToRecipe" class="ml-1 border border-amber-200 rounded px-4">
                    +
                  </button>
                </li>
                <li v-for="ingredient in editRecipe.ingredients">
                  <span @click="removeIngredientFromRecipe(ingredient)" class="cursor-pointer">🗑️</span> {{ ingredient }}
                </li>
              </ul>
            </div>

            <div class="mt-4 w-full">
              <div>
                <span class="ml-2">Note:</span>
                <textarea v-model="editRecipe.note" class="w-full ml-4 min-h-20 max-h-60 overflow-x-scroll border border-amber-200 rounded p-2"></textarea>
              </div>

              <div class="mt-4">
              <span class="ml-2">Tags:</span>
              <ul class="list-disc ml-4 max-h-40 overflow-x-scroll border border-amber-200 rounded p-2">
                <li>
                  <input type="text" v-model="editRecipe.newTag" @keyup.enter="addNewTagToRecipe" class="max-h-60 overflow-x-scroll border border-amber-200 rounded"/>
                  <button @click="addNewTagToRecipe" class="ml-1 border border-amber-200 rounded px-4">
                    +
                  </button>
                </li>
                <li v-for="tag in editRecipe.tags">
                  <span @click="removeTagFromRecipe(tag)" class="cursor-pointer">🗑️</span> {{ tag }}
                </li>
              </ul>
            </div>
            </div>
          </div>

          <div class="mt-4" v-if="editRecipeModalMessage != ''">
            <p class="text-blue-500">{{ editRecipeModalMessage }}</p>
          </div>

          <div class="mt-4">
            <button @click="saveRecipe" class="mx-2 bg-transparent hover:bg-amber-500 text-amber-700 font-semibold hover:text-white py-1 px-4 border border-amber-500 hover:border-transparent rounded">
              Save
            </button>
            <button @click="copyRecipe(editRecipe.recipeId)" class="mx-2 bg-transparent hover:bg-amber-500 text-amber-700 font-semibold hover:text-white py-1 px-4 border border-amber-500 hover:border-transparent rounded">
              Copy
            </button>
            <button @click="deleteRecipe(editRecipe.recipeId)" class="mx-2 bg-transparent hover:bg-amber-500 text-amber-700 font-semibold hover:text-white py-1 px-4 border border-amber-500 hover:border-transparent rounded">
              Delete
            </button>
            <button @click="isEditRecipeModelVisible = false" class="mx-2 bg-transparent hover:bg-amber-500 text-amber-700 font-semibold hover:text-white py-1 px-4 border border-amber-500 hover:border-transparent rounded">
              Close
            </button>
          </div>
        </div>

      </Modal>

      <Spinner v-if="showSpinner" :text="spinnerMessage"></Spinner>
  
    </div>
  
</template>
    
<script setup>  
  import { ref } from 'vue';
  import Modal from './components/Modal.vue';
  import Spinner from './components/Spinner.vue';

  definePageMeta({
    middleware: 'auth'
  });

  const MealplanState = {
    NEW: 'NEW',
    UPDATED: 'UPDATED',
    SAVED: 'SAVED',
  }

  const fetchRecipe = await useFetch('/api/recipe');
  const fetchMealplans = await useFetch('/api/mealplan');
  
  const recipes = ref(fetchRecipe.data);
  const selectedRecipes = ref([]);
  
  const refresh_recipes = () => {
    fetchRecipe.refresh();
    selectedRecipes.value = [];
  };
  
  const mealplans = ref(fetchMealplans.data);
  const refresh_mealplans = fetchMealplans.refresh;

  const dropdownSelectedMealplanId = ref('');

  // recipe filter
  const recipeFilter = ref('');

  // Info messages
  const editMealplanMessage = ref('');
  const editRecipeModalMessage = ref('');
  const editRecipeModalNewNameMessage = ref('');

  // Modal visibility
  const isEditRecipeModelVisible = ref(false);
  
  // Edit mealplan form
  const editMealplan = ref({
    mealplanId: null,
    originalName: null,
    newName: null,
    recipes: [],
    ingredients: [],
    newIngredient: null,
    state: null,
  })
  
  // Edit recipe form
  const editRecipe = ref({
    recipeId: null,
    originalName: null,
    newName: null,
    note: null,
    ingredients: [],
    newIngredient: null,
    newTag: null,
    tags: [],
  });

  // Loading spinner
  const showSpinner = ref(false);
  const spinnerMessage = ref('');

  const showSpinnerWithMessage = (message) => {
    spinnerMessage.value = message;
    showSpinner.value = true;
  }

  const hideSpinner = () => {
    showSpinner.value = false;
    spinnerMessage.value = '';
  }
  
  const openEditRecipeModal = () => {
    isEditRecipeModelVisible.value = true;

    // populate edit recipe form with selected recipe
    const selected = getSingleSelectedRecipe();
    editRecipe.value.recipeId = selected.id;
    editRecipe.value.originalName = selected.name;
    editRecipe.value.newName = selected.name;
    editRecipe.value.note = selected.note;
    editRecipe.value.ingredients = selected.recipe_ingredients.map(i => i.name);
    editRecipe.value.newIngredient = null;
    editRecipe.value.tags = selected.tags || [];
    editRecipe.value.newTag = null;
    editRecipeModalNewNameMessage.value = null;
  }

  const resetEditRecipe = () => {
    editRecipe.value.recipeId = null;
    editRecipe.value.originalName = null;
    editRecipe.value.newName = null;
    editRecipe.value.note = null;
    editRecipe.value.ingredients = [];
    editRecipe.value.newIngredient = null;
    editRecipe.value.newTag = null;
    editRecipe.value.tags = [];
  }

  const resetEditMealplan = () => {
    editMealplan.value.id = null;
    editMealplan.value.originalName = null;
    editMealplan.value.newName = null;
    editMealplan.value.ingredients = [];
    editMealplan.value.recipes = [];
    editMealplan.value.state = null;
  }
  
  const resetApp = () => {
    resetEditMealplan();
    resetEditRecipe();
    selectedRecipes.value = [];
  }
  
  const createEmptyMealplanForm = () => {
    resetEditMealplan();
    editMealplan.value.state = MealplanState.NEW;
  }

  const openCreateRecipeModal = () => {
    resetEditRecipe();
    isEditRecipeModelVisible.value = true;
  }

  const getFilteredRecipes = () => {
    const cleanFilter = recipeFilter.value.trim().toLowerCase();
    if (cleanFilter == '') {
      return recipes.value;
    }
    const filterFunc = (recipe) => {
      console.log(recipe);
      const name = recipe.name.toLowerCase().includes(cleanFilter)
      const tag = recipe.tags && recipe.tags.join(' ').toLowerCase().includes(cleanFilter);
      return name || tag;
    }
    return recipes.value.filter(filterFunc);
  }

  const getSingleSelectedRecipe = () => {
    return selectedRecipes.value.length == 1 ? selectedRecipes.value[0] : null;
  }

  const updateMealplanNameInput = () => {
    if (editMealplan.value.originalName !== editMealplan.value.newName) {
      editMealplan.value.state = MealplanState.UPDATED;
    }
  }

  const removeIngredientFromRecipe = (ingredient) => {
    editRecipe.value.ingredients = editRecipe.value.ingredients.filter(ing => ing != ingredient);
  }

  const removeIngredientFromMealplan = (ingredient) => {
    editMealplan.value.ingredients = editMealplan.value.ingredients.filter(ing => ing != ingredient);
    editMealplan.value.state = MealplanState.UPDATED;
  }

  const addNewIngredientToMealplan = () => {
    const clean = stripAndUseStandardCapitalization(editMealplan.value.newIngredient);
    if (!clean || clean == '') {
      editMealplan.value.newIngredient = null;
      return;
    };
    if (!editMealplan.value.ingredients.includes(clean)) {
      editMealplan.value.ingredients = [clean, ...editMealplan.value.ingredients];
    }
    editMealplan.value.newIngredient = null;
    editMealplan.value.state = MealplanState.UPDATED;
  }

  const addNewIngredientToRecipe = () => {
    const clean = stripAndUseStandardCapitalization(editRecipe.value.newIngredient);
    if (!clean || clean == '') {
      editRecipe.value.newIngredient = null;
      return;
    };
    if (!editRecipe.value.ingredients.includes(clean)) {
      editRecipe.value.ingredients = [clean, ...editRecipe.value.ingredients];
    }
    editRecipe.value.newIngredient = null;
  }

  const addNewTagToRecipe = () => {
    const clean = editRecipe.value.newTag.trim().toLowerCase();
    if (!clean || clean == '') {
      editRecipe.value.newTag = null;
      return;
    };
    if (!editRecipe.value.tags.includes(clean)) {
      editRecipe.value.tags = [clean, ...editRecipe.value.tags];
    }
    editRecipe.value.newTag = null;
  }

  const removeTagFromRecipe = (tag) => {
    editRecipe.value.tags = editRecipe.value.tags.filter(t => t != tag);
  }

  const stripAndUseStandardCapitalization = (string) => {
    return string.trim().toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }
  
  const addSelectedToMealplan = () => {
    editMealplan.value.recipes = [...selectedRecipes.value.sort((a, b) => a.name.localeCompare(b.name))];
    editMealplan.value.state = MealplanState.UPDATED;
  }
  
  const createRecipeApi = async (recipeName, note, ingredients, tags, recipeId) => {
    const body = {
      name: recipeName,
      ingredients: ingredients,
      note: note,
      tags: tags
    }

    if (recipeId) {
      body.id = recipeId;
      body.fieldsToUpdate = ['name', 'note', 'ingredients', 'tags'];
    }

    showSpinnerWithMessage('Saving recipe...');
    return fetch('/api/recipe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }).finally(hideSpinner);
  }

  const saveRecipe = async () => {
    if (!editRecipe.value.newName || editRecipe.value.ingredients.length == 0) {
      setMessageWithTimer(editRecipeModalMessage, 'Recipe name or ingredients missing');
      return;
    }
    const response = await createRecipeApi(
      editRecipe.value.newName, 
      editRecipe.value.note,
      editRecipe.value.ingredients,
      editRecipe.value.tags,
      editRecipe.value.recipeId
    );
    if (response.ok) {
      setMessageWithTimer(editRecipeModalMessage, 'Recipe saved!', 10000);
      resetEditRecipe();
      refresh_recipes();
      selectedRecipes.value = [];
    } else {
      setMessageWithTimer(editRecipeModalMessage, 'Could not save recipe');
    }
  }
  
  const loadMealplan = (mealplanId) => {
    if (!mealplanId) {
      return;
    }

    const mealplanToLoad = mealplans.value.find(m => m.id == mealplanId);
    
    editMealplan.value.state = MealplanState.SAVED;
  
    // load mealplan into ingredients and recipes
    editMealplan.value.mealplanId = mealplanToLoad.id;
    editMealplan.value.originalName = mealplanToLoad.name;
    editMealplan.value.newName = mealplanToLoad.name;
  
    editMealplan.value.ingredients = [...mealplanToLoad.mealplan_ingredients.map(i => i.name)];
    editMealplan.value.recipes = [...mealplanToLoad.mealplan_recipes];
  }
  
  const saveMealplanApi = async (mealplanId, name, ingredients, recipes) => {
    showSpinnerWithMessage('Saving mealplan...');
    return fetch('/api/mealplan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id: mealplanId, name: name, ingredients: ingredients, recipes: recipes })
    }).finally(hideSpinner);
  }
  
  const saveMealplan = async () => {
    if (!editMealplan.value.newName) {
      setMessageWithTimer(editMealplanMessage, 'Mealplan name missing');
      return;
    }
    if (editMealplan.value.recipes.length == 0 && editMealplan.value.ingredients.length == 0) {
      setMessageWithTimer(editMealplanMessage, 'Please select either recipes or ingredients');
      return;
    }
    
    await saveMealplanApi(
      editMealplan.value.mealplanId ? editMealplan.value.mealplanId : null,
      editMealplan.value.newName, 
      editMealplan.value.ingredients, 
      editMealplan.value.recipes
    )
    .then(
      res => res.json()
    ).then(
      data => {
        if (data.status === 200) {
          editMealplan.value.state = MealplanState.SAVED;
          editMealplan.value.mealplanId = data.body.mealplan.id;
          editMealplan.value.newName = data.body.mealplan.name;
          editMealplan.value.originalName = data.body.mealplan.name;
          setMessageWithTimer(editMealplanMessage, 'Mealplan saved!');
          refresh_mealplans();
        } else {
          setMessageWithTimer(editMealplanMessage, 'Could not save mealplan!');
        }
      }
    )
  }
  
  const checkRecipeNameConflict = () => {
    if (recipes.value.find(r => r.name == editRecipe.value.newName) && editRecipe.value.newName != editRecipe.value.originalName) {
      editRecipeModalNewNameMessage.value = 'Recipe already exists';
    } else {
      editRecipeModalNewNameMessage.value = null;
    }
  }

  const setMessageWithTimer = (field, msg, ms=6000) => {
    field.value = msg;
    setTimeout(() => {
      field.value = '';
    }, ms);
  }
  
  const copyMealplan = async (mealplanId) => {
    showSpinnerWithMessage('Copying mealplan...');
    return fetch(`/api/mealplan?id=${mealplanId}`, {
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
        return saveMealplanApi(
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
          setMessageWithTimer(editMealplanMessage, 'Mealplan copied!');
        } else {
          setMessageWithTimer(editMealplanMessage, 'Could not copy mealplan.');
          console.log('Could not copy mealplan');
        }
      }
    ).finally(
      hideSpinner
    );
  }
  
  const copyRecipe = async (recipeId) => {
    showSpinnerWithMessage('Copying recipe...');
    return fetch(`/api/recipe?id=${recipeId}`, {
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
        const tags = data.tags;
        return createRecipeApi(name, note, ingredients, tags, null);
      }
    ).then(
      res => {
        if (res.ok) {
          refresh_recipes();
          setMessageWithTimer(editRecipeModalMessage, 'Recipe copied!');
        } else {
          setMessageWithTimer(editRecipeModalMessage, 'Could not copy recipe.');
          console.log('Could not copy recipe.');
        }
      }
    ).finally(
      hideSpinner
    );
  }

  const deleteRecipe = async (recipeId) => {
    showSpinnerWithMessage('Deleting recipe...');
    return fetch(`/api/recipe?id=${recipeId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
    }).then(res => {
      if (res.ok) {
        refresh_recipes();
        resetEditRecipe();
        setMessageWithTimer(editRecipeModalMessage, 'Recipe deleted!');
      } else {
        console.log('Could not delete recipe');
        setMessageWithTimer(editRecipeModalMessage, 'Could not delete recipe');
      }
    }).finally(
      hideSpinner
    );
  }
  
  const deleteMealplan = async (mealplanId) => {
    showSpinnerWithMessage('Deleting mealplan...');
    return fetch(`/api/mealplan?id=${mealplanId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
    }).then(res => {
      if (res.ok) {
        refresh_mealplans();
        resetEditMealplan();
        setMessageWithTimer(editMealplanMessage, 'Mealplan deleted!');
      } else {
        setMessageWithTimer(editMealplanMessage, 'Could not delete mealplan');
        console.log('Could not delete mealplan');
      }
    }).finally(
      hideSpinner
    );
  }

  const sendAsEmail = async (mealplanId) => {
    showSpinnerWithMessage('Sending mealplan...');
    return fetch(`/api/internal/email?mealplanId=${mealplanId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
    })
    .then(res => res.json())
    .then(data => {
      if (data.status === 200) {
        setMessageWithTimer(editMealplanMessage, 'Mealplan sent as email!');
      } else {
        console.log('Could not send mealplan as email');
        setMessageWithTimer(editMealplanMessage, 'Could not send mealplan as email');
      }
    }).finally(
      hideSpinner
    );
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
  