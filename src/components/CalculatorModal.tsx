import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { useThemeColor } from "@/hooks/useThemeColor";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

interface CalculatorModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CalculatorModal({
  visible,
  onClose,
}: CalculatorModalProps) {
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForNewValue, setWaitingForNewValue] = useState(false);

  const tintColor = useThemeColor({}, "tint");
  const cardBackground = useThemeColor({}, "cardBackground");
  const borderColor = useThemeColor({}, "border");
  const textColor = useThemeColor({}, "text");

  const handleNumber = (num: string) => {
    if (waitingForNewValue) {
      setDisplay(num);
      setWaitingForNewValue(false);
    } else {
      setDisplay(display === "0" ? num : display + num);
    }
  };

  const calculate = (
    firstValue: number,
    secondValue: number,
    operation: string
  ): number => {
    switch (operation) {
      case "+":
        return firstValue + secondValue;
      case "-":
        return firstValue - secondValue;
      case "×":
        return firstValue * secondValue;
      case "÷":
        return secondValue !== 0 ? firstValue / secondValue : 0;
      default:
        return secondValue;
    }
  };

  const handleOperation = (op: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);
      setDisplay(String(newValue));
      setPreviousValue(newValue);
    }

    setWaitingForNewValue(true);
    setOperation(op);
  };

  const handleEquals = () => {
    if (previousValue !== null && operation) {
      const inputValue = parseFloat(display);
      const newValue = calculate(previousValue, inputValue, operation);
      setDisplay(String(newValue));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForNewValue(true);
    }
  };

  const handleClear = () => {
    setDisplay("0");
    setPreviousValue(null);
    setOperation(null);
    setWaitingForNewValue(false);
  };

  const handleDecimal = () => {
    if (waitingForNewValue) {
      setDisplay("0.");
      setWaitingForNewValue(false);
    } else if (display.indexOf(".") === -1) {
      setDisplay(display + ".");
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: cardBackground },
          ]}
        >
          <View style={styles.modalHeader}>
            <ThemedText type="subtitle" style={styles.modalTitle}>
              Calculator
            </ThemedText>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color={textColor} />
            </TouchableOpacity>
          </View>

          {/* Display */}
          <View
            style={[
              styles.display,
              { backgroundColor: borderColor + "20", borderColor },
            ]}
          >
            <ThemedText
              style={[styles.displayText, { color: textColor }]}
              numberOfLines={1}
            >
              {display}
            </ThemedText>
          </View>

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            {/* Row 1: C, ÷, ×, − */}
            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: "#EF4444", borderColor: "#EF4444" },
              ]}
              onPress={handleClear}
            >
              <ThemedText
                style={[styles.buttonText, { color: "#fff" }]}
              >
                C
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonOperator, { borderColor }]}
              onPress={() => handleOperation("÷")}
            >
              <ThemedText
                style={[styles.buttonText, { color: tintColor }]}
              >
                ÷
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonOperator, { borderColor }]}
              onPress={() => handleOperation("×")}
            >
              <ThemedText
                style={[styles.buttonText, { color: tintColor }]}
              >
                ×
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonOperator, { borderColor }]}
              onPress={() => handleOperation("-")}
            >
              <ThemedText
                style={[styles.buttonText, { color: tintColor }]}
              >
                −
              </ThemedText>
            </TouchableOpacity>

            {/* Row 2: 7, 8, 9, + */}
            {[7, 8, 9].map((num) => (
              <TouchableOpacity
                key={num}
                style={[styles.button, styles.buttonNumber, { borderColor }]}
                onPress={() => handleNumber(String(num))}
              >
                <ThemedText
                  style={[styles.buttonText, { color: textColor }]}
                >
                  {num}
                </ThemedText>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.button, styles.buttonOperator, { borderColor }]}
              onPress={() => handleOperation("+")}
            >
              <ThemedText
                style={[styles.buttonText, { color: tintColor }]}
              >
                +
              </ThemedText>
            </TouchableOpacity>

            {/* Row 3: 4, 5, 6 */}
            {[4, 5, 6].map((num) => (
              <TouchableOpacity
                key={num}
                style={[styles.button, styles.buttonNumber, { borderColor }]}
                onPress={() => handleNumber(String(num))}
              >
                <ThemedText
                  style={[styles.buttonText, { color: textColor }]}
                >
                  {num}
                </ThemedText>
              </TouchableOpacity>
            ))}

            {/* Row 4: 1, 2, 3 */}
            {[1, 2, 3].map((num) => (
              <TouchableOpacity
                key={num}
                style={[styles.button, styles.buttonNumber, { borderColor }]}
                onPress={() => handleNumber(String(num))}
              >
                <ThemedText
                  style={[styles.buttonText, { color: textColor }]}
                >
                  {num}
                </ThemedText>
              </TouchableOpacity>
            ))}

            {/* Row 5: 0 (wide), ., = */}
            <TouchableOpacity
              style={[
                styles.button,
                styles.buttonNumber,
                styles.buttonZero,
                { borderColor },
              ]}
              onPress={() => handleNumber("0")}
            >
              <ThemedText
                style={[styles.buttonText, { color: textColor }]}
              >
                0
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonNumber, { borderColor }]}
              onPress={handleDecimal}
            >
              <ThemedText
                style={[styles.buttonText, { color: textColor }]}
              >
                .
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.buttonEquals,
                { backgroundColor: tintColor, borderColor: tintColor },
              ]}
              onPress={handleEquals}
            >
              <ThemedText
                style={[styles.buttonText, { color: "#fff" }]}
              >
                =
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    maxWidth: 400,
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  display: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    minHeight: 70,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  displayText: {
    fontSize: 32,
    fontWeight: "600",
  },
  buttonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  button: {
    width: "22%",
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    marginBottom: 10,
  },
  buttonZero: {
    width: "47%",
  },
  buttonNumber: {
    backgroundColor: "transparent",
  },
  buttonOperator: {
    backgroundColor: "transparent",
  },
  buttonEquals: {
    backgroundColor: "transparent",
  },
  buttonText: {
    fontSize: 24,
    fontWeight: "600",
  },
});
