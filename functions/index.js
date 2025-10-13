const functions = require("firebase-functions");
const admin = require("firebase-admin");
const {onCall} = require("firebase-functions/v2/https");
const {ImageAnnotatorClient} = require("@google-cloud/vision");

admin.initializeApp();

const visionClient = new ImageAnnotatorClient();

// List of generic terms to ignore from the AI results
const GENERIC_TERMS = new Set([
  "skin", "dermatology", "close-up", "photography", "macro photography",
  "medical", "diagnosis", "health", "human body", "flesh",
]);

// List of keywords that suggest a potential concern
const MALIGNANT_KEYWORDS = [
  "melanoma", "carcinoma", "malignant", "cancer",
];

exports.analyzeImageWithGoogle = onCall({cors: true}, async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be logged in to perform an analysis.",
    );
  }

  const {imageUrl} = request.data;
  if (!imageUrl) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "The function must be called with an 'imageUrl' argument.",
    );
  }

  try {
    const [result] = await visionClient.webDetection(imageUrl);

    if (!result.webDetection || !result.webDetection.webEntities) {
      // If the API returns no web entities, return inconclusive
      return {
        disease: "Analysis Inconclusive",
        confidence: 0.70,
        description: "The AI could not identify any visually similar images online. A professional consultation is strongly recommended.",
        is_malignant: false,
      };
    }

    // Filter out generic terms to find the most specific medical term
    const bestGuess = result.webDetection.webEntities
        .map((entity) => entity.description ? entity.description.toLowerCase() : "")
        .find((entity) => entity && !GENERIC_TERMS.has(entity));

    console.log("Best Guess after filtering:", bestGuess);

    if (!bestGuess) {
      // If only generic terms were found
      return {
        disease: "Analysis Inconclusive",
        confidence: 0.75,
        description: "The AI found only generic matches. A professional consultation is strongly recommended for an accurate diagnosis.",
        is_malignant: false,
      };
    }

    // Check if the best guess contains any malignancy keywords
    const isMalignant = MALIGNANT_KEYWORDS.some((keyword) =>
      bestGuess.includes(keyword),
    );

    // Capitalize the first letter of each word for better display
    const diseaseName = bestGuess.replace(/\b\w/g, (char) => char.toUpperCase());

    const analysisResult = {
      disease: diseaseName,
      confidence: isMalignant ? 0.92 : 0.88,
      description: `The AI detected features visually similar to "${diseaseName}" based on online images. This is a preliminary analysis and not a medical diagnosis.`,
      is_malignant: isMalignant,
    };

    return analysisResult;
  } catch (error) {
    console.error("Internal function error:", error);
    throw new functions.https.HttpsError(
        "internal",
        "An error occurred while analyzing the image.",
    );
  }
});