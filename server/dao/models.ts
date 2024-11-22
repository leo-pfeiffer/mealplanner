import { Model, InferAttributes, InferCreationAttributes, Sequelize, DataTypes, CreationOptional } from 'sequelize';

const PG_USER = process.env.PG_USER
const PG_PASSWORD = process.env.PG_PASSWORD
const PG_HOST = process.env.PG_HOST
const PG_DATABASE = process.env.PG_DATABASE
const PG_TEST_ENV_VAR = process.env.PG_TEST_ENV_VAR

if (!PG_USER || !PG_PASSWORD || !PG_HOST || !PG_DATABASE) {
    throw new Error('Environment variables PG_USER, PG_PASSWORD, PG_HOST, and PG_DATABASE must be set')
} else {
    console.log('Environment variables set.')
    console.log('PG_TEST_ENV_VAR:', PG_TEST_ENV_VAR)
}

const sequelize = new Sequelize(
    `postgresql://${PG_USER}:${PG_PASSWORD}@${PG_HOST}/${PG_DATABASE}?sslmode=require`,
    {
        dialectModule: require('pg')
    }
)

const tryConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
}}

tryConnection();

interface Recipe extends Model<InferAttributes<Recipe>, InferCreationAttributes<Recipe>> {
    id: CreationOptional<number>;
    name: string;
  }

const Recipe = sequelize.define<Recipe>(
    'recipe', 
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
    },
)

interface Ingredient extends Model<InferAttributes<Ingredient>, InferCreationAttributes<Ingredient>> {
    id: CreationOptional<number>;
    name: string;
  }

const Ingredient = sequelize.define<Ingredient>(
    'ingredient', 
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        }
    },
);

interface RecipeIngredient extends Model<InferAttributes<RecipeIngredient>, InferCreationAttributes<RecipeIngredient>> {
    id: CreationOptional<number>;
    recipeId: number;
    ingredientId: number;
  }

const RecipeIngredient = sequelize.define<RecipeIngredient>(
    'recipe_ingredient',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        recipeId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: Recipe,
                key: 'id',
            }
        },
        ingredientId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: Ingredient,
                key: 'id',
            }
        }
    },
);

Recipe.hasMany(RecipeIngredient, { foreignKey: 'recipeId' });
Ingredient.hasMany(RecipeIngredient, { foreignKey: 'ingredientId' });
RecipeIngredient.belongsTo(Recipe, { foreignKey: 'recipeId' });
RecipeIngredient.belongsTo(Ingredient, { foreignKey: 'ingredientId' });

interface Mealplan extends Model<InferAttributes<Mealplan>, InferCreationAttributes<Mealplan>> {
    id: CreationOptional<number>;
    name: string;
  }

const Mealplan = sequelize.define<Mealplan>(
    'mealplan',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
    },
);

interface MealplanRecipe extends Model<InferAttributes<MealplanRecipe>, InferCreationAttributes<MealplanRecipe>> {
    id: CreationOptional<number>;
    recipeId: number;
    mealplanId: number;
  }

const MealplanRecipe = sequelize.define<MealplanRecipe>(
    'mealplan_recipe',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        recipeId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: Recipe,
                key: 'id',
            }
        },
        mealplanId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: Mealplan,
                key: 'id',
            }
        },
    },
);

interface MealplanIngredient extends Model<InferAttributes<MealplanIngredient>, InferCreationAttributes<MealplanIngredient>> {
    id: CreationOptional<number>;
    ingredientId: number;
    mealplanId: number;
  }

const MealplanIngredient = sequelize.define<MealplanIngredient>(
    'mealplan_ingredient',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        ingredientId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: Ingredient,
                key: 'id',
            }
        },
        mealplanId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: Mealplan,
                key: 'id',
            }
        },
    },
);

Mealplan.hasMany(MealplanRecipe, { foreignKey: 'mealplanId' });
MealplanRecipe.belongsTo(Mealplan, { foreignKey: 'mealplanId' });

Recipe.hasMany(MealplanRecipe, { foreignKey: 'recipeId' });
MealplanRecipe.belongsTo(Recipe, { foreignKey: 'recipeId' });

Mealplan.hasMany(MealplanIngredient, { foreignKey: 'mealplanId' });
MealplanIngredient.belongsTo(Mealplan, { foreignKey: 'mealplanId' });

Ingredient.hasMany(MealplanIngredient, { foreignKey: 'ingredientId' });
MealplanIngredient.belongsTo(Ingredient, { foreignKey: 'ingredientId' });

sequelize.sync();

export { sequelize, Recipe, Ingredient, RecipeIngredient, Mealplan, MealplanRecipe, MealplanIngredient };