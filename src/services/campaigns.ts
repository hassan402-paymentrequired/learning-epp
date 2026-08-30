import api from '@/services/api';

export interface Campaign {
  uuid: string;
  title: string;
  message: string | null;
  image_url: string | null;
  link: string | null;
  link_text: string | null;
  countdown_target_at?: string | null;
  popup_frequency_days?: number | null;
}

export interface CampaignsResponse {
  marquee: Campaign | null;
  countdown: Campaign | null;
  popup: Campaign | null;
}

export async function fetchCampaigns(): Promise<CampaignsResponse> {
  const response = await api.get('/campaigns');
  return response.data.data;
}
