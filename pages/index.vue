<template>
    <div id="app" class="flex flex-col justify-between text-amber-700 font-comic-sans h-screen overflow-x-scroll">
  
      <div class="border border-amber-50 my-4 mx-8">
        <div class="px-2 py-2 bg-white border border-amber-200 rounded-lg shadow">
          <div class="flex flex-wrap py-2">
            <div class="py-1 px-4">
              <label>
                <button @click="createNewMealplan" class="bg-transparent hover:bg-amber-500 text-amber-700 font-semibold hover:text-white py-1 px-4 border border-amber-500 hover:border-transparent rounded">
                New meal plan
                </button>
                <input v-model="newMealplanNameInput" type="text" placeholder="Name" class="mx-1 bg-transparent hover:bg-amber-500 text-amber-700 font-semibold hover:text-white py-1 px-4 border border-amber-500 hover:border-transparent rounded"/>
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
              <button @click="isManagmentModalVisible = true" class="bg-transparent hover:bg-amber-500 text-amber-700 font-semibold hover:text-white py-1 px-4 border border-amber-500 hover:border-transparent rounded">
                Manage
              </button>
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
                <!-- Button to open the modal -->
                <button @click="openCreateRecipeModal()" class="bg-transparent hover:bg-amber-500 text-amber-700 font-semibold hover:text-white py-1 px-4 border border-amber-500 hover:border-transparent rounded">
                  Create recipe
                </button>

                <!-- Button to open the modal -->
                <button v-if="canEditRecipe()" @click="openEditRecipeModal" class=" ml-2 bg-transparent hover:bg-amber-500 text-amber-700 font-semibold hover:text-white py-1 px-4 border border-amber-500 hover:border-transparent rounded">
                  Edit
                </button>
  
              </div>
            </div>
  
            <div v-if="recipes" class="h-40 overflow-x-scroll border border-amber-300 my-2 p-2">
                <div v-for="recipe in recipes" :key="recipe.id">
                  <label class="inline-flex items-center">
                    <input type="checkbox" :value="recipe" v-model="selectedRecipes" class="form-checkbox">
                    <span class="ml-2">{{ recipe.name }}</span>
                  </label>
                </div>
              </div>
  
              <hr class="my-8 border-amber-300">
  
              <div class="">
                <p class="m-1 text-xl">Ingredients</p>
                <div id="ingredients-create">
                  <button @click="createIngredient" class="bg-transparent hover:bg-amber-500 text-amber-700 font-semibold hover:text-white py-1 px-4 border border-amber-500 hover:border-transparent rounded">
                    Add ingredient
                  </button>
                  <input type="text" v-model="newIngredient" @keyup.enter="createIngredient" class="mx-1 bg-transparent hover:bg-amber-500 text-amber-700 font-semibold hover:text-white py-1 px-4 border border-amber-500 hover:border-transparent rounded"/>
                </div>
              </div>
  
              <div v-if="ingredients" class="overflow-x-scroll h-40 border border-amber-300 my-2 p-2" id="ingredients-list">
                <div v-for="ingredient in ingredients" :key="ingredient.id" class="w-full">
                  <label class="inline-flex items-center">
                    <input type="checkbox" :value="ingredient" v-model="selectedIngredients" class="form-checkbox">
                    <span class="ml-2">{{ ingredient.name }}</span>
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
                <span class="ml-2">Recipes:</span>
                <ul v-if="mealplanRecipes.length > 0" class="list-disc ml-4 max-h-60 overflow-x-scroll border border-amber-200 rounded p-2">
                  <li v-for="recipe in mealplanRecipes" class="pb-2">
                    {{ recipe.name }}
                    <ul class="list-disc ml-10">
                      <li v-for="ingredient in recipe.recipe_ingredients" class="">
                        {{ ingredient.ingredient.name }}
                      </li>
                    </ul>
                  </li>
                </ul>
                <p v-else class="ml-4 text-amber-700">Select recipes on the left!</p>
              </div>
  
              <div class="mt-4">
                <span class="ml-2">Additional Ingredients:</span>
                <ul v-if="mealplanIngredients.length > 0" class="list-disc ml-4 max-h-60 overflow-x-scroll border border-amber-200 rounded p-2">
                  <li v-for="ingredient in mealplanIngredients" class="">
                    {{ ingredient.name }}
                  </li>
                </ul>
                <p v-else class="ml-4 text-amber-700">Select additional ingredients on the left!</p>
              </div>
              
              <button 
              @click="createMealPlan" :disabled="mealplanIsSaved" :class="mealplanIsSaved ? 'hover:cursor-not-allowed' : 'hover:cursor-pointer'" class="mt-4 bg-transparent hover:bg-amber-500 text-amber-700 font-semibold hover:text-white py-1 px-4 border border-amber-500 hover:border-transparent rounded">
                Save meal plan
              </button>
              <button 
              @click="sendAsEmail" :disabled="!mealplanIsSaved" :class="!mealplanIsSaved ? 'hover:cursor-not-allowed' : 'hover:cursor-pointer'" class="ml-4 mt-4 bg-transparent hover:bg-amber-500 text-amber-700 font-semibold hover:text-white py-1 px-4 border border-amber-500 hover:border-transparent rounded">
              ✉️ Send as e-mail
              </button>
  
              <div class="mt-4" v-if="mealplanMessage != ''">
                <p class="text-blue-500">{{ mealplanMessage }}</p>
              </div>
  
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
            <button @click="isRecipeEditModalVisible = false" class="mx-2 bg-transparent hover:bg-amber-500 text-amber-700 font-semibold hover:text-white py-1 px-4 border border-amber-500 hover:border-transparent rounded">
              Close
            </button>
          </div>
        </div>

      </Modal>
  
      <Modal :show="isManagmentModalVisible" @close="isManagmentModalVisible = false">
        <h2 class="text-xl font-bold">Rename | Copy | Delete</h2>
  
        <p class="my-4">
          ℹ️ You can't delete recipes or ingredients that are used in a mealplan or other recipes. 
          To do so, you must first remove them from the mealplan / recipe, or delete the mealplan / recipe.
        </p>
  
        <hr class="my-8 border-amber-300">
  
        <div class="my-8 flex justify-between">
  
          <div class="h-70">
            <p class="text-xl m-2">Meal Plans <span>{{ manageMealPlanStatus }}</span></p>
            <div class="max-h-60 overflow-x-scroll">
              <table class="table-auto">
                <tbody>
                  <tr v-for="mealplan in mealplans" :key="mealplan.id">
                    <td class="bg-amber-50">{{ mealplan.name }}</td>
                    <td @click="deleteMealplan(mealplan.id)" class="text-center hover:cursor-pointer">🗑️</td>
                    <td @click="copyMealplan(mealplan.id)" class="text-center hover:cursor-pointer">
                      📋
                    </td>
                    <td> <input type="text" placeholder="Rename" @keyup.enter="updateMealplanName(mealplan.id, $event)"></input> </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
  
  
          <div class="h-70">
            <p class="text-xl m-2">Recipes <span>{{ manageRecipeStatus }}</span></p>
            <div class="max-h-60 overflow-x-scroll">
              <table class="table-auto">
                <tbody>
                  <tr v-for="recipe in recipes" :key="recipe.id">
                    <td class="bg-amber-50">{{ recipe.name }}</td>
                    <td @click="deleteRecipe(recipe.id)" class="text-center" :class="isRecipeDeletable(recipe.id) ? 'hover:cursor-pointer' : 'hover:cursor-not-allowed'">
                      {{ isRecipeDeletable(recipe.id) ? '🗑️' : '🚫' }}
                    </td>
                    <td @click="copyRecipe(recipe.id)" class="text-center hover:cursor-pointer">
                      📋
                    </td>
                    <td> <input type="text" placeholder="Rename" @keyup.enter="updateRecipeName(recipe.id, $event)"></input> </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
  
  
          <div class="h-70">
            <p class="text-xl m-2">Ingredients <span>{{ manageIngredientStatus }}</span></p>
            <div class="max-h-60 overflow-x-scroll">
              <table class="table-auto">
                <tbody>
                  <tr v-for="ingredient in ingredients" :key="ingredient.id">
                    <td class="bg-amber-50">{{ ingredient.name }}</td>
                    <td @click="deleteIngredient(ingredient.id)" class="text-center" :class="isIngredientDeletable(ingredient.id) ? 'hover:cursor-pointer' : 'hover:cursor-not-allowed'">
                      {{ isIngredientDeletable(ingredient.id) ? '🗑️' : '🚫' }}
                    </td>
                    <td> <input type="text" placeholder="Rename" @keyup.enter="updateIngredientName(ingredient.id, $event)"></input> </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        
        </div>
  
        <div class="mt-4">
          <button @click="isManagmentModalVisible = false" class="mx-2 bg-transparent hover:bg-amber-500 text-amber-700 font-semibold hover:text-white py-1 px-4 border border-amber-500 hover:border-transparent rounded">
            Close
          </button>
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
  const fetchIngredients = await useFetch('/api/ingredient');
  const fetchMealplans = await useFetch('/api/mealplan');
  
  const recipes = ref(fetchRecipe.data);
  const refresh_recipes = () => {
    fetchRecipe.refresh();
    selectedRecipes.value = [];
  };
  
  const ingredients = ref(fetchIngredients.data);
  const refresh_ingredients = fetchIngredients.refresh;
  
  const mealplans = ref(fetchMealplans.data);
  const refresh_mealplans = fetchMealplans.refresh;
  
  const newIngredient = ref('');
  
  const newMealplanNameInput = ref('');
  const newMealplanName = ref('');
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
  const isManagmentModalVisible = ref(false);
  
  const modalMessage = ref('');
  
  const manageMealPlanStatus = ref('');
  const manageRecipeStatus = ref('');
  const manageIngredientStatus = ref('');

  const canEditRecipe = () => {
    console.log('canEditRecipe', selectedRecipes.value);
    return selectedRecipes.value.length == 1;
  }
  
  const isRecipeDeletable = (recipeId) => {
    // todo fix
    return !mealplans.value.some(m => m.mealplan_recipes.some(r => r.recipe.id == recipeId));
  }
  
  const isIngredientDeletable = (ingredientId) => {
    // todo fix
    const recipe_ingredient = recipes.value.some(r => r.recipe_ingredients.some(i => i.ingredient.id == ingredientId));
    const mealplan_ingredient = mealplans.value.some(m => m.mealplan_ingredients.some(i => i.ingredient.id == ingredientId));
    return !recipe_ingredient && !mealplan_ingredient;
  }

  const getSingleSelectedRecipe = () => {
    return selectedRecipes.value.length == 1 ? selectedRecipes.value[0] : null;
  }
  
  const openEditRecipeModal = () => {
    isRecipeEditModalVisible.value = true;
    const selected = getSingleSelectedRecipe();
    console.log(selected)
    editRecipeId.value = selected.id;
    editRecipeOriginalName.value = selected.name;
    editRecipeName.value = selected.name;
    editRecipeNote.value = selected.note;
    editRecipeIngredients.value = selected.recipe_ingredients.map(i => i.ingredient.name);
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

  const removeIngredientFromEditRecipe = (ingredient) => {
    console.log('Removing ingredient', ingredient);
    editRecipeIngredients.value = editRecipeIngredients.value.filter(ing => ing != ingredient);
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
    mealplanIngredients.value = [...selectedIngredients.value];
    mealplanRecipes.value = [...selectedRecipes.value];
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

    console.log("createRecipeApi", body);

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
      console.log('Recipe name or ingredients missing');
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
      refresh_ingredients();
      selectedRecipes.value = [];
      console.log("Selected recipes", selectedRecipes.value);
    } else {
      setMessageWithTimer(modalMessage, 'Could not save recipe');
    }
  }
  
  const createIngredient = async () => {
    const clean = stripAndUseStandardCapitalization(newIngredient.value);
    if (!clean || clean == '') {
      newIngredient.value = '';
      return;
    };
    const response = await fetch('/api/ingredient', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: clean })
    })
    if (response.ok) {
      newIngredient.value = ''
      refresh_ingredients();
    }
  }
  
  const loadExistingMealplan = () => {
    if (!currentMealplanId.value) {
      return;
    }
    loadedMealplan.value = mealplans.value.find(m => m.id == currentMealplanId.value);
    newMealplanNameInput.value = '';
    hasLoadedMealplan.value = true;
  
    // load mealplan into mealplanIngredients and mealplanRecipes
    newMealplanName.value = loadedMealplan.value.name;
  
    mealplanIngredients.value = [...loadedMealplan.value.mealplan_ingredients.map(r => r.ingredient)];
    mealplanRecipes.value = [...loadedMealplan.value.mealplan_recipes.map(r => r.recipe)];
  
    // select ingredients and recipes
    const recipeIdsInMealplan = loadedMealplan.value.mealplan_recipes.map(r => r.recipe.id);
    const newSelectedRecipes = [];
    for (const r of recipes.value) {
      if (recipeIdsInMealplan.includes(r.id)) {
        newSelectedRecipes.push(r);
      }
    }
    selectedRecipes.value = [...newSelectedRecipes];
  
    const ingredientIdsInMealplan = loadedMealplan.value.mealplan_ingredients.map(r => r.ingredient.id);
    const newSelectedIngredients = [];
    for (const i of ingredients.value) {
      if (ingredientIdsInMealplan.includes(i.id)) {
        newSelectedIngredients.push(i);
      }
    }
    selectedIngredients.value = [...newSelectedIngredients];

    mealplanIsSaved.value = true;
  }
  
  const resetApp = () => {
    newMealplanName.value = '';
    newMealplanNameInput.value = '';
    hasLoadedMealplan.value = false;
    loadedMealplan.value = {};
    selectedRecipes.value = [];
    selectedIngredients.value = [];
    mealplanIngredients.value = [];
    mealplanRecipes.value = [];
  }
  
  const createNewMealplan = () => {
    newMealplanName.value = newMealplanNameInput.value;
    newMealplanNameInput.value = '';
    hasLoadedMealplan.value = false;
    loadedMealplan.value = {};
    currentMealplanId.value = '';
    mealplanRecipes.value = [];
    mealplanIngredients.value = [];
    mealplanIsSaved.value = false;
  
    console.log('Creating new mealplan');
  }
  
  const createMealplanApi = async (name, ingredients, recipes) => {
    return fetch('/api/mealplan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: name, ingredients: ingredients, recipes: recipes })
    })
  }
  
  const createMealPlan = async () => {
    if (!newMealplanName.value) {
      console.log('Mealplan name or recipes missing');
      setMessageWithTimer(mealplanMessage, 'Mealplan name missing');
      return;
    }
    if (mealplanRecipes.value.length == 0 && mealplanIngredients.value.length == 0) {
      console.log('Pleace select either recipes or ingredients');
      setMessageWithTimer(mealplanMessage, 'Please select either recipes or ingredients');
      return;
    }
    const ingredients = mealplanIngredients.value.map(i => i.id);
    const recipes = mealplanRecipes.value.map(i => i.recipe_ingredients)
      .flatMap(ri => ri.map(r => r.recipeId))
      .reduce((acc, cur) => acc.includes(cur) ? acc : [...acc, cur], []);
    
    await createMealplanApi(newMealplanName.value, ingredients, recipes)
    .then(
      res => res.json()
    ).then(
      data => {
        if (data.status === 200) {
          console.log('Mealplan saved!');
          mealplanIsSaved.value = true;
          currentMealplanId.value = data.body.mealplanId;
          setMessageWithTimer(mealplanMessage, 'Mealplan saved!');
          refresh_mealplans();
        } else {
          console.log('Could not save mealplan.');    
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
  
  const updateIngredientName = async (ingredientId, e) => {
    const newName = stripAndUseStandardCapitalization(e.target.value);
    if (!newName || newName == ''){
      return
    };
    const response = await fetch('/api/ingredient', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id: ingredientId, name: newName })
    })
    if (response.ok) {
      e.target.value = '';
      refresh_ingredients();
      setMessageWithTimer(manageIngredientStatus, '✅', 1000);
    } else {
      setMessageWithTimer(manageIngredientStatus, '⚠️', 2000);
      console.log('Could not update ingredient name');
    }
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
      console.log('Could not update recipe name');
    }
  }
  
  const updateMealplanName = async (mealplanId, e) => {
    const newName = e.target.value.trim();
    if (!newName || newName == ''){
      return
    };
    const response = await fetch('/api/mealplan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id: mealplanId, name: newName })
    })
    if (response.ok) {
      e.target.value = '';
      refresh_mealplans();
      setMessageWithTimer(manageMealPlanStatus, '✅', 1000);
    } else {
      setMessageWithTimer(manageMealPlanStatus, '⚠️', 2000);
      console.log('Could not update mealplan name');
    }
  }
  
  const copyMealplan = (mealplanId) => {
    fetch(`/api/mealplan?id=${mealplanId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
    }).then(res => {
      if (res.ok) {
        return res.json();
      } else {
        console.log('Could not copy mealplan');
      }
    }).then(
      data => {
        const name = data.name + ' (copy)';
        const ingredients = data.mealplan_ingredients.map(i => i.ingredient.id);
        const recipes = data.mealplan_recipes.map(r => r.recipeId);
        return createMealplanApi(name, ingredients, recipes);
      }
    ).then(
      res => {
        if (res.ok) {
          console.log('Mealplan copied');
          refresh_mealplans();
        } else {
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
    }).then(res => {
      if (res.ok) {
        return res.json();
      } else {
        console.log('Could not copy recipe');
      }
    }).then(
      data => {
        const name = data.name + ' (copy)';
        const note = data.note;
        const ingredients = data.recipe_ingredients.map(i => i.ingredient.name);
        return createRecipeApi(name, note, ingredients, null);
      }
    ).then(
      res => {
        if (res.ok) {
          refresh_recipes();
        } else {
          console.log('Could not copy recipe');
        }
      }
    );
  }
  
  const deleteIngredient = async (ingredientId) => {
    if (!isIngredientDeletable(ingredientId)) {
      return;
    }
    const resp = await fetch(`/api/ingredient?id=${ingredientId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
    })
    if (resp.ok) {
      refresh_ingredients();
    } else {
      // todo
      console.log('Could not delete ingredient');
    }
  }
  
  const deleteRecipe = async (recipeId) => {
    if (!isRecipeDeletable(recipeId)) {
      return;
    }
    const resp = await fetch(`/api/recipe?id=${recipeId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
    })
    if (resp.ok) {
      refresh_recipes();
    } else {
      // todo
      console.log('Could not delete recipe');
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
    } else {
      console.log('Could not delete mealplan');
    }
  }

  const sendAsEmail = async () => {
    if (!currentMealplanId.value) {
      console.log('No mealplan saved or loaded.');
      return;
    }
    console.log('Sending mealplan as email:', currentMealplanId.value);
    const resp = await fetch(`/api/internal/email?mealplanId=${currentMealplanId.value}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
    })
    .then(res => res.json())
    .then(data => {
      if (data.status === 200) {
        console.log('Mealplan sent as email');
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
  