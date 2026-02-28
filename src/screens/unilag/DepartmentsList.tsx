import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { AppLayout } from "@/components/AppLayout";
import { useNavigation } from "@react-navigation/native";
import { useThemeColor } from "@/hooks/useThemeColor";
import api from "@/services/api";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

interface Department {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

export function DepartmentsList() {
  const navigation = useNavigation();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tintColor = useThemeColor({}, "tint");
  const cardBackground = useThemeColor({}, "cardBackground");
  const borderColor = useThemeColor({}, "border");

  const loadDepartments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/departments");

      if (response.data.success && response.data.data) {
        setDepartments(response.data.data);
        if (response.data.data.length === 0) {
          setError("No departments are available at the moment.");
        }
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to load departments. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const handleSelectDepartment = (departmentId: number) => {
    // @ts-ignore
    navigation.navigate("DepartmentSubjects", { departmentId });
  };

  if (loading) {
    return (
      <AppLayout showBackButton={true} headerTitle="Select Department">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
          <ThemedText style={styles.loadingText}>Loading departments...</ThemedText>
        </View>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout showBackButton={true} headerTitle="Select Department">
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity
            style={[styles.retryButton, { borderColor: tintColor }]}
            onPress={loadDepartments}
          >
            <ThemedText style={{ color: tintColor }}>Try Again</ThemedText>
          </TouchableOpacity>
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout showBackButton={true} headerTitle="Select Department">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Select Department
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Choose your department to practice Unilag questions
          </ThemedText>
        </View>

        {departments.length > 0 ? (
          <View style={styles.list}>
            {departments.map((department) => (
              <TouchableOpacity
                key={department.id}
                style={[
                  styles.departmentCard,
                  { backgroundColor: cardBackground, borderColor },
                ]}
                onPress={() => handleSelectDepartment(department.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconWrapper, { backgroundColor: tintColor + "20" }]}>
                  <MaterialIcons name="school" size={24} color={tintColor} />
                </View>
                <View style={styles.departmentInfo}>
                  <ThemedText style={styles.departmentName}>{department.name}</ThemedText>
                  {department.description && (
                    <ThemedText style={styles.departmentDesc} numberOfLines={2}>
                      {department.description}
                    </ThemedText>
                  )}
                </View>
                <MaterialIcons name="chevron-right" size={24} color={borderColor} />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>No departments available.</ThemedText>
          </View>
        )}
      </ScrollView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    opacity: 0.7,
  },
  errorContainer: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    textAlign: "center",
    marginBottom: 16,
    color: "#dc2626",
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderRadius: 8,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  list: {
    gap: 12,
  },
  departmentCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  departmentInfo: {
    flex: 1,
  },
  departmentName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  departmentDesc: {
    fontSize: 14,
    opacity: 0.7,
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    opacity: 0.7,
  },
});
