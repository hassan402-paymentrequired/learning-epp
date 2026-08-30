import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchCampaigns, type Campaign } from '@/services/campaigns';
import { CampaignPopupModal } from '@/components/campaigns/CampaignPopupModal';
import { useAuth } from '@/contexts/AuthContext';

type CampaignContextValue = {
  marquee: Campaign | null;
  countdown: Campaign | null;
};

const CampaignContext = createContext<CampaignContextValue | undefined>(undefined);

const popupStorageKey = (uuid: string) => `campaign_popup_last_shown:${uuid}`;

function daysSince(dateString: string): number {
  const then = new Date(dateString).getTime();
  const now = Date.now();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

export function CampaignProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [marquee, setMarquee] = useState<Campaign | null>(null);
  const [countdown, setCountdown] = useState<Campaign | null>(null);
  const [popupCampaign, setPopupCampaign] = useState<Campaign | null>(null);
  const [showPopup, setShowPopup] = useState(false);

  const evaluatePopup = useCallback(async (popup: Campaign | null) => {
    if (!popup) {
      setPopupCampaign(null);
      setShowPopup(false);
      return;
    }

    const frequencyDays = popup.popup_frequency_days ?? 1;
    const lastShown = await AsyncStorage.getItem(popupStorageKey(popup.uuid));

    const dueToShow = !lastShown || daysSince(lastShown) >= frequencyDays;

    setPopupCampaign(popup);
    setShowPopup(dueToShow);
  }, []);

  const loadCampaigns = useCallback(async () => {
    try {
      const data = await fetchCampaigns();
      setMarquee(data.marquee);
      setCountdown(data.countdown);
      await evaluatePopup(data.popup);
    } catch {
      // Fail silently — campaigns are non-critical, don't block the app.
    }
  }, [evaluatePopup]);

  useEffect(() => {
    if (!isAuthenticated) return;

    void loadCampaigns();

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void loadCampaigns();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, loadCampaigns]);

  const handleDismissPopup = useCallback(() => {
    if (popupCampaign) {
      void AsyncStorage.setItem(popupStorageKey(popupCampaign.uuid), new Date().toISOString());
    }
    setShowPopup(false);
  }, [popupCampaign]);

  return (
    <CampaignContext.Provider value={{ marquee, countdown }}>
      {children}
      {popupCampaign && showPopup && (
        <CampaignPopupModal
          campaign={popupCampaign}
          visible={showPopup}
          onDismiss={handleDismissPopup}
        />
      )}
    </CampaignContext.Provider>
  );
}

export function useCampaigns() {
  const context = useContext(CampaignContext);
  if (context === undefined) {
    throw new Error('useCampaigns must be used within a CampaignProvider');
  }
  return context;
}
