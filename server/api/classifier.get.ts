import * as tf from '@tensorflow/tfjs';

const encodings = [
  'snacks',
  'pantry',
  'beverages',
  'frozen',
  'dairy eggs',
  'household',
  'meat seafood',
  'dry goods pasta',
  'breakfast',
  'canned goods',
  'produce',
  'international',
  'deli',
  'alcohol',
  'bakery'
]

async function loadTokenizer() {
    const response = await fetch('http://localhost:3000/tfjs_model/tokenizer.json');
    return await response.json();
}

function tokenizeInput(texts: string[], tokenizerConfig: any) {
    const word_index = JSON.parse(tokenizerConfig["config"]["word_index"]);
    const maxLen = 10;
    const sequences = texts.map(text => {
      const sequence = text
        .toLowerCase()
        .split(/\s+/)
        .map(word => word_index[word] ?? 0);
      
        const paddedSequence = Array(maxLen).fill(0);
        for (let i = 0; i < Math.min(sequence.length, maxLen); i++) {
            paddedSequence[maxLen - i - 1] = sequence[sequence.length - i - 1];
        }
        return paddedSequence;
    })
    // tf.tensor([paddedSequence], [1, maxLen]);
    return tf.tensor2d(sequences, [texts.length, maxLen]);
}

export default defineEventHandler(async (event) => {
    const model = await tf.loadLayersModel('http://localhost:3000/tfjs_model/model.json');
    const query = getQuery(event);
    const word = query.word;
    console.log("Word:", word);
    if (word) {
      const tokenizerConfig = await loadTokenizer();
      const tokenizedInput = tokenizeInput(["chicken", "blueberries", "ham", "pasta"], tokenizerConfig);
      
      let prediction = model.predict(tokenizedInput);
      prediction = Array.isArray(prediction) ? prediction : [prediction];

      console.log("Prediction:", prediction);

      const output = prediction
        .map(tensor => tensor.argMax(-1).dataSync())
        .map(res => Array.from(res).map(r => encodings[r]));
      
      return {"result": "success", "prediction": output};
    } else {
      return {"result": "error", "message": "Missing word parameter"};
    }
  })
  