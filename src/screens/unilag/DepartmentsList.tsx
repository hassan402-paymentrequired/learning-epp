import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  TextInput,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { AppLayout } from "@/components/AppLayout";
import { useNavigation } from "@react-navigation/native";
import { useThemeColor } from "@/hooks/useThemeColor";
import api from "@/services/api";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Fonts } from "@/constants/Fonts";

interface Department {
  id: number;
  name: string;
  slug: string;
  description?: string;
  subjects_count: number;
}

export function DepartmentsList() {
  const navigation = useNavigation();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const tintColor = "#4800b2";
  const borderColor = "#f1f5f9";
  const textColor = "#1a1c1d";

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

  const filteredDepartments = departments.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <ThemedText style={{ color: tintColor, fontFamily: Fonts.primary.semiBold }}>Try Again</ThemedText>
          </TouchableOpacity>
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout showBackButton={true} headerTitle="Departments">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText style={styles.title}>
            Select Department
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Choose your faculty to explore related course questions
          </ThemedText>
        </View>

        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color="#a1a1aa" style={styles.searchIcon} />
          <TextInput
            placeholder="Search Here"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#a1a1aa"
          />
        </View>

        {filteredDepartments.length > 0 ? (
          <View style={[styles.listContainer, { borderColor }]}>
            {departments.map((department, index) => {
              const isLast = index === departments.length - 1;
              return (
                <TouchableOpacity
                  key={department.id}
                  style={[
                    styles.listItem,
                    !isLast && { borderBottomWidth: 1, borderBottomColor: borderColor }
                  ]}
                  onPress={() => handleSelectDepartment(department.id)}
                  activeOpacity={0.6}
                >
                  <View style={styles.iconBox}>
                    <MaterialIcons name="school" size={22}  style={{opacity: 0.2}} />
                  </View>
                  <View style={styles.infoBox}>
                    <ThemedText style={[styles.departmentName, { color: textColor }]}>
                      {department.name}
                    </ThemedText>
                    <ThemedText style={styles.departmentDesc} numberOfLines={1}>
                      Available course: {department.subjects_count}
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              );
            })}
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
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    color: '#615b6e',
    fontFamily: Fonts.primary.regular,
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
    color: "#ba1a1a",
    fontFamily: Fonts.primary.regular,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderRadius: 8,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: Fonts.primary.bold,
    color: '#4800b2',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#615b6e',
    fontFamily: Fonts.primary.regular,
    lineHeight: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    marginHorizontal: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 20,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: Fonts.primary.regular,
    fontSize: 14,
    color: '#1a1c1d',
  },
  listContainer: {
    marginHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    gap: 10
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  iconBox: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#ebe2f5ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  infoBox: {
    flex: 1,
  },
  departmentName: {
    fontSize: 16,
    fontFamily: Fonts.primary.semiBold,
    marginBottom: 2,
  },
  departmentDesc: {
    fontSize: 13,
    color: '#71717a',
    fontFamily: Fonts.primary.regular,
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    color: '#615b6e',
    fontFamily: Fonts.primary.regular,
  },
});
