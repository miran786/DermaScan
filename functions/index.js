const functions = require("firebase-functions");
const admin = require("firebase-admin");
const vision = require("@google-cloud/vision");

admin.initializeApp();

// Initialize the Google Cloud Vision client
const visionClient = new vision.ImageAnnotatorClient();

exports.analyzeImageWithGoogle = functions.https.onCall(async (data, context) => {
  // Ensure the user is authenticated.
  if (!context.auth) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "The function must be called while authenticated.",
    );
  }

  const imageUrl = data.imageUrl;
  if (!imageUrl) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "The function must be called with an 'imageUrl' argument.",
    );
  }

  try {
    // Use the Vision AI to detect labels in the image.
    // In a real-world scenario, you'd use a more sophisticated model,
    // but for this example, we'll simulate a result based on labels.
    const [result] = await visionClient.labelDetection(imageUrl);
    const labels = result.labelAnnotations.map((label) => label.description.toLowerCase());

    // --- MOCK ANALYSIS LOGIC ---
    // This is a simplified example. A real application would use a custom
    // AutoML model trained on skin lesion images.
    let disease = "Benign Nevus (Mole)";
    let description = "This appears to be a common mole. These are typically harmless but should be monitored for changes.";
    let confidence = 0.85 + Math.random() * 0.1; // Simulate high confidence
    let isMalignant = false;

    if (labels.includes("melanoma") || labels.includes("lesion") && (labels.includes("asymmetry") || labels.includes("irregular"))) {
      disease = "Suspicious Lesion (Possible Melanoma)";
      description = "The lesion shows characteristics that warrant further investigation by a dermatologist. Asymmetry or irregular borders can be warning signs.";
      confidence = 0.75 + Math.random() * 0.1;
      isMalignant = true;
    } else if (labels.includes("keratosis")) {
      disease = "Seborrheic Keratosis";
      description = "This is a common, non-cancerous skin growth. They often appear in middle-aged or older adults.";
      confidence = 0.90 + Math.random() * 0.05;
      isMalignant = false;
    }

    // Return the structured analysis result
    return {
      disease,
      description,
      confidence,
      is_malignant: isMalignant,
      labels, // Also return the labels for debugging or more info
    };
  } catch (error) {
    console.error("Error calling Vision API:", error);
    throw new functions.https.HttpsError(
        "internal",
        "Unable to analyze the image.",
        error,
    );
  }
});