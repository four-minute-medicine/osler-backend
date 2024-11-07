// LlamaIndex
import { QdrantVectorStore } from "llamaindex";

export const vectorStore = new QdrantVectorStore({
    url: "http://localhost:6333",
});
