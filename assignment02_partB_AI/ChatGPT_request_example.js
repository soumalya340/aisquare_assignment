const { secrets } = require("./Functions-request-config")

const prompt = args[0]

// if{
//     !secrets.openaikey
// }{
// throw Error(
//     "Need to set OPENAI_KEY environment variable")
// }

const url = "https://api.openai.com/v1/completions"
const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${secrets.openaikey}`,
}

const data = {
  model: "text-davinci-003", // or another model like gpt-3.5-turbo
  prompt: prompt,
  max_tokens: 150,
  temperature: 0.7,
}

const openAiRequest = Functions.makeHttpRequest({
  url: "https://api.openai.com/v1/completions",
  method: "POST",
  headers: headers,
  body: JSON.stringify(data),
})

const openAiResponse = await openAiRequest
console.log("raw response", openAiResponse)
console.log("raw response data", openAiResponse.data.choice[0])

let result = openAiResponse.data.choices[0].text.replce(/\n/g, "").replce(/\./g, "").trim()
console.log(`name ${result}`)

return Functions.encodeString(result)
