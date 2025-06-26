// utils/storage.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

export const saveFileLocally = async (fileContent: any) => {
  await AsyncStorage.setItem("uploadedFile", JSON.stringify(fileContent));
};

export const getSavedFile = async () => {
  const file = await AsyncStorage.getItem("uploadedFile");
  return file ? JSON.parse(file) : null;
};