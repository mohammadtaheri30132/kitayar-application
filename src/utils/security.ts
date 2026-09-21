import hmacSHA256 from 'crypto-js/hmac-sha256';
import Hex from 'crypto-js/enc-hex';

// این کلید باید دقیقاً همون چیزی باشه که تو سرور گذاشتی
const HMAC_SECRET =  'aksdmaskdmsdmadk@#$@#$FDFDgdfgifhsdhj9ne23nn2j3neifoinf2noifen9n';

export const generateHMACSignature = (timestamp: string, endpoint: string, bodyData: any) => {
  const bodyString = bodyData && Object.keys(bodyData).length ? JSON.stringify(bodyData) : '';
  const message = `${timestamp}:${endpoint}:${bodyString}`;
  
  return hmacSHA256(message, HMAC_SECRET).toString(Hex);
};