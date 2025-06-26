import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveBackgroundColor: 'black',
        tabBarStyle: { backgroundColor: '#1E3A8A' },
        tabBarActiveTintColor: '#611BF8',
        tabBarInactiveTintColor: '#A3BFFA',
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="Home"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="Library"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="library" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="Quiz"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="quiz" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="Profile"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require('../../../assets/images/10709674.png')}
              style={{
                height: size,
                width: size,
                borderRadius: 99,
                flex:1,
                
              }}
            />
          ),
        }}
      />
    </Tabs>
  );
}
