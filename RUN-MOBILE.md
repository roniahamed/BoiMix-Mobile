# BoiMix মোবাইল অ্যাপ চালানোর নির্দেশনা

এই প্রজেক্টে npm এবং Expo SDK 58 ব্যবহার করা হয়। নিচের কমান্ডগুলো Mac-এর Terminal থেকে চালান।

## ১. ব্যাকএন্ড চালু করুন

OrbStack বা Docker Desktop চালু করুন। তারপর ব্যাকএন্ডের লোকাল `.env` কনফিগার করা থাকলে:

```bash
cd /Users/roni/Desktop/BoiMix-Backend
docker compose up -d
docker compose ps
```

ডেটাবেস ও অন্য সার্ভিসগুলো শুরু হতে কিছু সময় লাগতে পারে। API ঠিকভাবে চালু আছে কি না দেখতে:

```bash
curl http://localhost:8080/health/
```

সাধারণত `{"status": "ok"}` পাওয়া যাবে। এই সেটআপে API পোর্ট `8080`, WebSocket পোর্ট `8001` এবং Docker-এর আরেকটি সার্ভিস পোর্ট `8081` ব্যবহার করে। ব্যাকএন্ডের `.env` বা Docker সেটআপের বিস্তারিত তার নিজস্ব README-তে আছে।

## ২. মোবাইল সার্ভার চালু করুন

নতুন Terminal উইন্ডো বা ট্যাবে:

```bash
cd /Users/roni/Desktop/BoiMix-Mobile
npx expo start --lan --go --port 8082
```

Terminal চালু রাখুন। সার্ভার বন্ধ করতে এই Terminal-এ `Ctrl+C` চাপুন। প্রথমবার dependencies ইনস্টল করা না থাকলে, উপরের কমান্ডের আগে `npm ci` চালান।

## ৩. ফোনে খুলুন

1. ফোন ও Mac একই Wi-Fi-তে রাখুন এবং ফোনে Expo Go চালু করুন।
2. Terminal-এ দেখানো QR code স্ক্যান করুন। Android-এ Expo Go-এর স্ক্যানার বা iPhone-এ Camera ব্যবহার করতে পারেন।
3. Terminal-এ `exp://...:8082` লিংকও দেখাবে। বর্তমান সেটআপে সেটি `exp://192.168.0.100:8082`; আপনার Mac-এর IP বদলালে Terminal-এ দেখানো নতুন লিংক ব্যবহার করুন।
4. Physical iPhone ব্যবহার করলে Expo CLI ও Expo Go-তে একই Expo অ্যাকাউন্টে লগইন করুন। প্রয়োজনে Mac-এ `npx expo login` চালান।

ওয়েবে দেখতে একই সার্ভার চালু রেখে ব্রাউজারে [http://localhost:8082](http://localhost:8082) খুলুন।

## ৪. IP বদলে গেলে

Mac-এর Wi-Fi IP দেখতে:

```bash
ipconfig getifaddr en0
```

`en0`-তে ফল না এলে System Settings → Wi-Fi → Details-এ IP দেখুন। ফোন থেকে API ও realtime connection পৌঁছানোর জন্য মোবাইল প্রজেক্টের `.env.development`-এ বর্তমান Mac IP বসান। উদাহরণ:

```dotenv
EXPO_PUBLIC_API_BASE_URL=http://192.168.0.100:8080/api/v1
EXPO_PUBLIC_WS_BASE_URL=ws://192.168.0.100:8001
```

`192.168.0.100` নিজের বর্তমান IP দিয়ে বদলান; `localhost` ব্যবহার করবেন না, কারণ ফোনে সেটি ফোনটিকেই বোঝায়। ফাইল বদলানোর পর Expo সার্ভার `Ctrl+C` দিয়ে বন্ধ করে আবার চালু করুন এবং অ্যাপ reload করুন।

## সমস্যা হলে

- অ্যাপ না খুললে QR code আবার স্ক্যান করুন, একই Wi-Fi নিশ্চিত করুন এবং Expo Go আপডেট করুন। প্রয়োজন হলে সার্ভার `npx expo start --lan --go --port 8082 --clear` দিয়ে পুনরায় চালু করুন।
- একই Wi-Fi-তেও সংযোগ না হলে নেটওয়ার্কে ডিভাইসগুলোর মধ্যে যোগাযোগ বন্ধ থাকতে পারে। বিকল্প হিসেবে `npx expo start --tunnel --go --port 8082` চালাতে পারেন; Expo অতিরিক্ত tunnel dependency চাইতে পারে। Tunnel দিয়ে Expo bundle পৌঁছালেও লোকাল API-এর `8080` ও WebSocket-এর `8001` পোর্ট ফোন থেকে আলাদাভাবে পৌঁছাতে হবে।
- অ্যাপ খুললেও বই বা লগইন না চললে ব্যাকএন্ড `docker compose ps` ও `curl http://localhost:8080/health/` দিয়ে দেখুন এবং `.env.development`-এর IP যাচাই করুন।
- `8082` পোর্ট ব্যস্ত থাকলে `lsof -nP -iTCP:8082 -sTCP:LISTEN` দিয়ে কোন প্রক্রিয়া ব্যবহার করছে দেখুন।
- Expo Go-তে কিছু native ফিচার, বিশেষ করে remote push notification, সম্পূর্ণ পরীক্ষা করতে development build লাগতে পারে।

## কোড যাচাই

```bash
cd /Users/roni/Desktop/BoiMix-Mobile
npx tsc --noEmit
npx expo lint
```

Expo-এর আরও নির্দেশনা: [Start developing](https://docs.expo.dev/get-started/start-developing/) এবং [iOS Expo Go sign-in](https://docs.expo.dev/troubleshooting/expo-go-sign-in-required/)।
