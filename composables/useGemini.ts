export const useGemini = () => {
    const config = useRuntimeConfig();
    const API_KEY = config.public.geminiAPIKey;
    if (!API_KEY) {
        throw new Error('Missing environment variables for Gemini');
    }

    const basePrompt = "Classify this shopping list by where in the supermarket I would find the respective item.\n"
    + "Do not add or remove any items from the list. If there are duplicates in the list, add up the quantities into a single item.\n" 
    + "Format the output as a HTML list, but do not include any other HTML elements and return the list as plain text, i.e. without backticks.\n"
    + "Add a headline for each supermarket section, and add the items under the respective headline.\n"
    + "Here is the list: ";

    const makePrompt = async (ingredients: string[]) => {
        return basePrompt + ingredients.join(", ");
    }
    
    const classify = async(ingredients: string[]): Promise<String> => {
        const prompt = await makePrompt(ingredients);
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "contents": [
                    {
                        "parts": [
                            {
                                "text": prompt
                            }
                        ]
                    }
                ]
            })
        })
        .then(res => res.json())
        .then(data => {
            try {
                return data.candidates[0].content.parts[0].text;
            } catch (error) {
                console.error(error);
                throw Error("Error parsing response from Gemini.");
            }
        })
        .catch(err => {
            console.error(err);
            throw Error("Error fetching from Gemini.");
        });
        return resp;
    }

    return { classify };
}