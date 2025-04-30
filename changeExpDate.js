const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const { readFileSync } = require('fs');
const { DateTime } = require('luxon'); // ✅ Add Luxon

const readFileLines = (filename) =>
  readFileSync(filename).toString('utf8').split('\n').filter(Boolean);

function initializeAppSA() {
  const serviceAccount = require('./waw-backend-uat-firebase-adminsdk-f8fo8-e68311707e.json');
  initializeApp({
    credential: cert(serviceAccount)
  });
  return getFirestore();
}

const db = initializeAppSA();

async function changeExpDate(db) {
  const arr = readFileLines('couponexp.txt');

  for (let i = 0; i < arr.length; i++) {
    const element = arr[i].trim();
    if (!element) continue;

    const docRef = db.collection('couponIssues').doc(element);
    const doc = await docRef.get();

    if (!doc.exists) {
      console.log(`${element};No Coupon`);
    } else {
      const data = doc.data();

      console.log(
        `get ${doc.id} expireAt=${data.expireAt.toDate().toISOString()} endAt=${data.endAt.toDate().toISOString()}`
      );
    //   console.log(`${doc.id};${data.businessId};${data.expireAt};${data.status};${data.endAt};${data.amountSold};`);

      // ✅ Convert UTC to Africa/Cairo timezone
    //   const expireDate = DateTime.fromISO('2025-08-31T23:59:59', { zone: 'Africa/Cairo' }).toJSDate();
    //   const endDate = DateTime.fromISO('2025-09-30T23:59:59', { zone: 'Africa/Cairo' }).toJSDate();

    //   await docRef.update({
    //     expireAt: Timestamp.fromDate(expireDate),
    //     endAt: Timestamp.fromDate(endDate),
    //   });

    //   console.log(
    //     `get ${doc.id} expireAt=${data.expireAt.toString()} endAt=${data.endAt.toString()}`
    //   );
    }
  }
}

changeExpDate(db).catch(console.error);
