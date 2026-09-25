import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, I18nManager } from 'react-native';
import { Search } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import { api } from '../../../api/axiosConfig';

const InteractionHeader = ({ onSearchPress, navigation }: any) => {
  const { colors } = useTheme();
  const [fullName, setFullName] = useState('محمد طاهری');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/teacher/profile');
        if (response.data.success && response.data.data.fullName) {
          setFullName(response.data.data.fullName);
        }
      } catch (error) {
        // Silently fail to fallback
      }
    };
    fetchProfile();
  }, []);

  return (
    <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <TouchableOpacity style={styles.iconBtn} onPress={onSearchPress}>
        <Search color={colors.text} size={24} />
      </TouchableOpacity>

      <Text style={[styles.title, { color: colors.text }]}>تعامل</Text>

      <TouchableOpacity 
        style={styles.profileBtn}
        onPress={() => navigation?.navigate('ProfileScreen')}
      >
        <Text style={[styles.profileName, { color: colors.text }]}>{fullName}</Text>
        <View style={[styles.avatarWrapper, { borderColor: '#bae6fd' }]}>
          <Image 
            source={{ uri: 'https://i.pravatar.cc/150?u=fake@pravatar.com' }} 
            style={styles.avatar} 
          />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  iconBtn: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
  },
  profileBtn: {
    flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
    alignItems: 'center',
  },
  profileName: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'IRANSansX',
    marginHorizontal: 12,
  },
  avatarWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
});

export default InteractionHeader;
