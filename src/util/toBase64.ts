export default function toBase64(obj: object): string {
  const json = JSON.stringify(obj);
  const encoder = new TextEncoder();
  const utf8Bytes = encoder.encode(json);
  const base64String = btoa(String.fromCharCode(...utf8Bytes));
  return base64String;
}
