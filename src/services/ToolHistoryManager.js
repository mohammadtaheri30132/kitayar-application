import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY = '@kitayar_history';

export const saveToolHistory = async (toolType, fileName, resultPath, size, format) => {
  try {
    const newRecord = {
      id: Date.now().toString(),
      toolType,
      title: fileName,
      resultPath,
      size,
      format,
      date: new Date().toISOString(),
    };
    
    const existing = await AsyncStorage.getItem(HISTORY_KEY);
    const historyList = existing ? JSON.parse(existing) : [];
    
    historyList.unshift(newRecord);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(historyList));
  } catch (e) {
    console.error("خطا در ذخیره تاریخچه", e);
  }
};

export const getToolHistory = async (toolType) => {
  try {
    const data = await AsyncStorage.getItem(HISTORY_KEY);
    const allHistory = data ? JSON.parse(data) : [];
    return allHistory.filter(item => item.toolType === toolType);
  } catch (e) {
    return [];
  }
};

export const deleteToolHistory = async (toolType, id) => {
  try {
    const data = await AsyncStorage.getItem(HISTORY_KEY);
    const allHistory = data ? JSON.parse(data) : [];
    const filteredHistory = allHistory.filter(item => item.id !== id);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(filteredHistory));
    
    return filteredHistory.filter(item => item.toolType === toolType);
  } catch (e) {
    console.error("خطا در حذف تاریخچه", e);
    return [];
  }
};