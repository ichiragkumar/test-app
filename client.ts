import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc, Timestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { addMonths } from 'date-fns';


// Firebase configurations
export const stageFirebaseConfig = {
  apiKey: import.meta.env.VITE_apiKey,
  authDomain: import.meta.env.VITE_authDomain,
  projectId: import.meta.env.VITE_projectId,
  storageBucket: import.meta.env.VITE_storageBucket,
  messagingSenderId: import.meta.env.VITE_messagingSenderId,
  appId: import.meta.env.VITE_appId,
};

export const prodFirebaseConfig = {
  apiKey: import.meta.env.VITE_PROD_API_KEY,
  authDomain: import.meta.env.VITE_PROD_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROD_PROJECT_ID,
  storageBucket: import.meta.env.VITE_PROD_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_PROD_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_PROD_APP_ID,
};


// ✅ Initialize Client Apps
export const stageApp = initializeApp(stageFirebaseConfig, 'stage');
export const prodApp = initializeApp(prodFirebaseConfig, 'production');



export const prodDB = getFirestore(prodApp);
export const stageDB = getFirestore(stageApp);



export const stageAuth = getAuth(stageApp);
export const prodAuth = getAuth(prodApp);


export const updateCouponsInStage = async (
  couponIdOrIds: string | string[], 
  expirationDate: string
): Promise<{ success: boolean, updatedIds: string[], errors: string[] }> => {
  try {
    // Ensure the user is authenticated
    if (!stageAuth.currentUser) {
      throw new Error("User must be authenticated to update coupons in stage environment");
    }

    console.log(stageAuth.currentUser)
    
    return await updateCoupons(stageDB, couponIdOrIds, expirationDate);
  } catch (error) {
    console.error("Error updating coupons in stage environment:", error);
    return { 
      success: false, 
      updatedIds: [], 
      errors: [error instanceof Error ? error.message : "Unknown error"] 
    };
  }
};


export const updateCouponsInProd = async (
  couponIdOrIds: string | string[], 
  expirationDate: string
): Promise<{ success: boolean, updatedIds: string[], errors: string[] }> => {
  try {

    if (!prodAuth.currentUser) {
      throw new Error("User must be authenticated to update coupons in production environment");
    }

    console.log(prodAuth.currentUser)
    
    return await updateCoupons(prodDB, couponIdOrIds, expirationDate);
  } catch (error) {
    console.error("Error updating coupons in production environment:", error);
    return { 
      success: false, 
      updatedIds: [], 
      errors: [error instanceof Error ? error.message : "Unknown error"] 
    };
  }
};


const updateCoupons = async (
  db: any, 
  couponIdOrIds: string | string[], 
  expirationDate: string
): Promise<{ success: boolean, updatedIds: string[], errors: string[] }> => {
  const couponIds = Array.isArray(couponIdOrIds) ? couponIdOrIds : [couponIdOrIds];
  const expireAtDate = addMonths(expirationDate,0)
  const endAtDate = addMonths(expireAtDate, 1);
  
  const updatedIds: string[] = [];
  const errors: string[] = [];

  // Process each coupon ID
  for (const id of couponIds) {
    try {
      // Handle both direct IDs and full paths
      const couponId = id.includes('/') ? id.split('/').pop()! : id;
      const ref = doc(db, "couponIssues", couponId);
      
      // Check if document exists
      const snapshot = await getDoc(ref);
      if (!snapshot.exists()) {
        errors.push(`Coupon with ID ${couponId} not found`);
        continue;
      }
      
      // Update the document
      await updateDoc(ref, {
        expireAt: Timestamp.fromDate(expireAtDate),
        endAt: Timestamp.fromDate(endAtDate)
      });
      
      updatedIds.push(couponId);
      console.log(`Successfully updated coupon ${couponId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      errors.push(`Error updating coupon ${id}: ${errorMessage}`);
      console.error(`Error updating coupon ${id}:`, error);
    }
  }

  return {
    success: updatedIds.length > 0,
    updatedIds,
    errors
  };
};





