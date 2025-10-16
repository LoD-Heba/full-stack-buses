export class BusResponseDto {
  id: string;
  plate: string;
  model: string;
  year: number;
  service_type: string;
  amenities: string;
  image_url: string;
  status: string;
  floors: number;
  is_active: boolean;
  capacity: number; 
  user: any;
  stacks: any[];
  routes: any[];
  trips: any[];
}