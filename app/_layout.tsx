import { Ionicons } from "@expo/vector-icons";
import { Drawer } from "expo-router/drawer";

export default function RootLayout() {
  return (
    <Drawer
      screenOptions={{
        headerStyle: {
          backgroundColor: "#F2F2F7",
        },
        headerShadowVisible: false,
        headerTitleStyle: {
          fontWeight: "700",
        },
        drawerActiveTintColor: "#007AFF",
        drawerInactiveTintColor: "#3A3A3C",
        drawerStyle: {
          backgroundColor: "#FFFFFF",
          width: 290,
        },
        drawerLabelStyle: {
          fontSize: 16,
          marginLeft: -5,
        },
      }}
    >
      <Drawer.Screen
        name="home"
        options={{
          title: "Career Intelligence",
          drawerLabel: "Home",
          drawerIcon: ({ color, size }) => (
            <Ionicons
              name="home-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Drawer.Screen
        name="add-job"
        options={{
          title: "Career Intelligence",
          drawerLabel: "Add Job",
          drawerIcon: ({ color, size }) => (
            <Ionicons
              name="add-circle-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Drawer.Screen
        name="jobs"
        options={{
          title: "Career Intelligence",
          drawerLabel: "My Jobs",
          drawerIcon: ({ color, size }) => (
            <Ionicons
              name="briefcase-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Drawer.Screen
        name="keywords"
        options={{
          title: "Career Intelligence",
          drawerLabel: "Keywords",
          drawerIcon: ({ color, size }) => (
            <Ionicons
              name="pricetags-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Drawer.Screen
        name="cover-letter"
        options={{
          title: "Career Intelligence",
          drawerLabel: "Cover Letter",
          drawerIcon: ({ color, size }) => (
            <Ionicons
              name="document-text-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Drawer.Screen
        name="profile"
        options={{
          title: "Career Intelligence",
          drawerLabel: "Profile",
          drawerIcon: ({ color, size }) => (
            <Ionicons
              name="person-circle-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Drawer.Screen
        name="index"
        options={{
          headerShown: false,
          drawerItemStyle: {
            display: "none",
          },
        }}
      />
    </Drawer>
  );
}