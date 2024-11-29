import { Model, InferAttributes, InferCreationAttributes, Sequelize, DataTypes, CreationOptional } from 'sequelize';
import pg from "pg";

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
        dialectModule: pg,
    },
)

const tryConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
}}

tryConnection();

// RECIPE

interface Recipe extends Model<InferAttributes<Recipe>, InferCreationAttributes<Recipe>> {
    id: CreationOptional<number>;
    name: string;
    note: string;
    tags: string[];
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
        note: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        tags: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: true,
        },
    },
);

interface RecipeIngredient extends Model<InferAttributes<RecipeIngredient>, InferCreationAttributes<RecipeIngredient>> {
    id: CreationOptional<number>;
    recipeId: number;
    name: string;
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
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        }
    },
);

Recipe.hasMany(RecipeIngredient, { foreignKey: 'recipeId', onDelete: 'CASCADE' });
RecipeIngredient.hasMany(Recipe, { foreignKey: 'ingredientId', onDelete: 'CASCADE' });


// MEALPLAN

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
    mealplanId: number;
    name: string;
    note: string;
    tags: string[];
  }

const MealplanRecipe = sequelize.define<MealplanRecipe>(
    'mealplan_recipe',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        mealplanId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: Mealplan,
                key: 'id',
            }
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        note: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        tags: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: true,
        },
    },
);

interface MealplanRecipeIngredient extends Model<InferAttributes<MealplanRecipeIngredient>, InferCreationAttributes<MealplanRecipeIngredient>> {
    id: CreationOptional<number>;
    mealplanRecipeId: number;
    name: string;
  }

const MealplanRecipeIngredient = sequelize.define<MealplanRecipeIngredient>(
    'mealplan_recipe_ingredient',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        mealplanRecipeId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: MealplanRecipe,
                key: 'id',
            }
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        }
    },
);

interface MealplanIngredient extends Model<InferAttributes<MealplanIngredient>, InferCreationAttributes<MealplanIngredient>> {
    id: CreationOptional<number>;
    mealplanId: number;
    name: string;
  }

const MealplanIngredient = sequelize.define<MealplanIngredient>(
    'mealplan_ingredient',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        mealplanId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: Mealplan,
                key: 'id',
            }
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        }
    },
);

Mealplan.hasMany(MealplanRecipe, { foreignKey: 'mealplanId' , onDelete: 'CASCADE' });

MealplanRecipe.hasMany(MealplanRecipeIngredient, { foreignKey: 'mealplanRecipeId', onDelete: 'CASCADE', as: 'recipe_ingredients' });

Mealplan.hasMany(MealplanIngredient, { foreignKey: 'mealplanId', onDelete: 'CASCADE' });

sequelize.sync();

export { 
    sequelize, 
    Recipe, 
    RecipeIngredient, 
    Mealplan, 
    MealplanRecipe, 
    MealplanRecipeIngredient, 
    MealplanIngredient 
};