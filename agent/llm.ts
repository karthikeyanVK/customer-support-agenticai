// Instantiate the LangChain Azure OpenAI model (Microsoft AI Foundry)
// Reads connection details from environment variables — see .env.example

import { AzureChatOpenAI } from "@langchain/openai";

export const llm = new AzureChatOpenAI({
  // Deployment name as configured in your Azure AI Foundry project
  azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME,
  azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME,
  azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
  azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION ?? "2024-08-01-preview",
  temperature: 0.3,
  streaming: true,
});
