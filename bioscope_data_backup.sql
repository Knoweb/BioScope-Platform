-- BioScope Data Export
-- Generated: 2026-02-27T08:34:58.379Z

-- Data for Name: users; Type: TABLE DATA
INSERT INTO public.users ("user_id", "email", "password_hash", "name", "phone", "role", "is_active", "created_at", "updated_at", "last_login") VALUES
('ab97fd38-c7e8-486a-8a37-a3f39c7e98d6', 'admin@bioscope.local', '$2b$12$PLACEHOLDER_HASH', 'Admin User', NULL, 'admin', true, '2026-02-23T04:20:40.772318+00:00', '2026-02-23T04:20:40.772318+00:00', NULL),
('c4f4fbdd-73a3-4673-93e0-b709c4b0b999', 'operator@bioscope.local', '$2b$12$PLACEHOLDER_HASH', 'Operator', NULL, 'operator', true, '2026-02-23T04:20:40.772318+00:00', '2026-02-23T04:20:40.772318+00:00', NULL),
('920641bf-329e-4603-9308-2cc74ff74b74', 'api-test@bioscope.io', 'managed_by_supabase_auth', 'API Tester', NULL, 'user', true, '2026-02-25T15:45:27.464159+00:00', '2026-02-25T15:52:11.703696+00:00', NULL),
('ae6529c2-d7ee-45f3-856d-51bb3cc8cfd6', 'testuser@bioscope.io', 'managed_by_supabase_auth', 'Test User', NULL, 'user', true, '2026-02-25T15:45:29.025837+00:00', '2026-02-25T15:52:15.893135+00:00', NULL),
('87be1e81-fdd8-4efb-82f8-ccee60076178', 'isurusajan9@gmail.com', 'managed_by_supabase_auth', 'Isuru gamage', NULL, 'user', true, '2026-02-25T15:45:30.303341+00:00', '2026-02-25T15:52:18.138759+00:00', NULL),
('92afa777-a9ec-4dd2-b51e-801f30b0a3d6', 'poorni@gmail.com', 'managed_by_supabase_auth', 'Poorni', NULL, 'user', true, '2026-02-25T15:45:31.358832+00:00', '2026-02-25T15:52:18.979772+00:00', NULL);

-- Data for Name: devices; Type: TABLE DATA
INSERT INTO public.devices ("device_id", "name", "type", "description", "location", "gateway", "firmware_version", "ip_address", "mac_address", "status", "owner_user_id", "added_date", "last_seen", "deleted_at") VALUES
('C2', 'Enclosure Monitor Beta', 'Environmental Sensor + Actuator Hub', NULL, 'Zone A - Rack 2', 'BLE Gateway v1.0', '2.4.1', '192.168.1.102', NULL, 'online', 'ab97fd38-c7e8-486a-8a37-a3f39c7e98d6', '2026-02-23T04:20:40.772318+00:00', '2026-02-26T13:27:37+00:00', NULL),
('C1', 'Enclosure Monitor Alpha', 'Environmental Sensor + Actuator Hub', NULL, 'Zone A - Rack 1', 'BLE Gateway v1.0', '2.4.1', '192.168.1.101', NULL, 'online', 'ab97fd38-c7e8-486a-8a37-a3f39c7e98d6', '2026-02-23T04:20:40.772318+00:00', '2026-02-26T13:31:28+00:00', NULL),
('QWDQW', 'dwqdwq', 'Standard Monitor', NULL, 'wqdw', NULL, NULL, NULL, NULL, 'offline', 'ab97fd38-c7e8-486a-8a37-a3f39c7e98d6', '2026-02-26T10:38:48.862458+00:00', NULL, '2026-02-26T10:43:20.141+00:00');

-- Data for Name: sensor_types; Type: TABLE DATA
INSERT INTO public.sensor_types ("sensor_type_id", "name", "unit", "min_value", "max_value", "description", "created_at") VALUES
(1, 'Temperature', '°C', -40, 125, 'Ambient temperature measurement', '2026-02-23T04:20:40.772318+00:00'),
(2, 'Humidity', '%', 0, 100, 'Relative humidity measurement', '2026-02-23T04:20:40.772318+00:00'),
(3, 'Light Level', 'lux', 0, 100000, 'Illuminance measurement', '2026-02-23T04:20:40.772318+00:00'),
(4, 'CO2', 'ppm', 0, 5000, 'Carbon dioxide concentration', '2026-02-23T04:20:40.772318+00:00'),
(5, 'Air Pressure', 'hPa', 300, 1100, 'Atmospheric pressure', '2026-02-23T04:20:40.772318+00:00');

-- Data for Name: sensors; Type: TABLE DATA
INSERT INTO public.sensors ("sensor_id", "device_id", "sensor_type_id", "name", "location", "is_active", "calibration_offset", "last_reading", "last_reading_time", "added_date", "deleted_at") VALUES
('a65afe27-193e-4c37-a06d-42a1875363ae', 'C1', 1, 'Temperature (NTC)', 'Enclosure Center', true, 0, NULL, NULL, '2026-02-23T04:20:40.772318+00:00', NULL),
('27ac87be-7c2d-41a6-b1c9-2c395e4f508b', 'C1', 2, 'Humidity (DHT22)', 'Enclosure Center', true, 0, NULL, NULL, '2026-02-23T04:20:40.772318+00:00', NULL),
('df0b50b7-5120-4f36-a56e-73f7f426ed1e', 'C1', 3, 'Light Level (LDR)', 'Front Panel', true, 0, NULL, NULL, '2026-02-23T04:20:40.772318+00:00', NULL),
('568568dd-e755-4248-9390-76cae0ba8244', 'C2', 1, 'Temperature (NTC)', 'Enclosure Center', true, 0, NULL, NULL, '2026-02-23T04:20:40.772318+00:00', NULL),
('5d4ba852-7a27-4219-b394-aeb53a3657bf', 'C2', 2, 'Humidity (DHT22)', 'Enclosure Center', true, 0, NULL, NULL, '2026-02-23T04:20:40.772318+00:00', NULL),
('3d743113-bfd3-46ad-8429-7e6ecac65c3c', 'C2', 3, 'Light Level (LDR)', 'Front Panel', true, 0, NULL, NULL, '2026-02-23T04:20:40.772318+00:00', NULL);

-- Data for Name: actuators; Type: TABLE DATA
INSERT INTO public.actuators ("actuator_id", "device_id", "name", "type", "description", "status", "current_value", "min_value", "max_value", "last_changed", "changed_by_user_id", "is_active", "auto_control_enabled", "added_date", "deleted_at") VALUES
('8077c36c-ed09-4a9d-9435-d20b419af769', 'C1', 'Heater', 'relay', 'Heating element', false, NULL, 0, 100, NULL, NULL, true, false, '2026-02-23T04:20:40.772318+00:00', NULL),
('2035e1ef-2567-40f4-a377-92528869f739', 'C1', 'LED Light', 'pwm', 'LED grow light', false, NULL, 0, 100, NULL, NULL, true, false, '2026-02-23T04:20:40.772318+00:00', NULL),
('71f78cc9-e865-4fb7-b970-799517356249', 'C2', 'Fan', 'relay', 'Cooling fan', false, NULL, 0, 100, NULL, NULL, true, false, '2026-02-23T04:20:40.772318+00:00', NULL),
('4c3df117-904a-4542-a9a2-beef41274fac', 'C2', 'Heater', 'relay', 'Heating element', false, NULL, 0, 100, NULL, NULL, true, false, '2026-02-23T04:20:40.772318+00:00', NULL),
('487dc7aa-8deb-4cfd-9dd8-5090cc6a124b', 'C2', 'LED Light', 'pwm', 'LED grow light', false, NULL, 0, 100, NULL, NULL, true, false, '2026-02-23T04:20:40.772318+00:00', NULL),
('ec8e76b4-bf36-4454-bb25-d51eeeba88a3', 'C1', 'Fan', 'relay', 'Cooling fan', true, NULL, 0, 100, '2026-02-25T16:23:31.035+00:00', '920641bf-329e-4603-9308-2cc74ff74b74', true, false, '2026-02-23T04:20:40.772318+00:00', NULL),
('22817704-c31e-444f-9c51-2d46e8137943', 'C1', 'Fan', 'relay', NULL, true, NULL, 0, 100, '2026-02-26T11:45:10+00:00', NULL, true, true, '2026-02-26T06:15:13.31605+00:00', NULL),
('46fb7214-a74f-4ea0-a24f-cdd16ec6ee82', 'C1', 'Heater', 'relay', NULL, false, NULL, 0, 100, '2026-02-26T11:45:10+00:00', NULL, true, true, '2026-02-26T06:15:16.31+00:00', NULL),
('2e4ababc-9d8e-4c9d-8cc7-014dc3efd945', 'C1', 'LED Light', 'pwm', NULL, true, NULL, 0, 100, '2026-02-26T11:45:10+00:00', NULL, true, true, '2026-02-26T06:15:18.472134+00:00', NULL),
('16fce584-fbf7-4e47-87b9-6f617dc4a65c', 'C1', 'Fan', 'relay', NULL, true, NULL, 0, 100, '2026-02-26T11:52:51+00:00', NULL, true, true, '2026-02-26T06:22:53.575501+00:00', NULL),
('edd707bd-9a47-4854-9f0f-ab1580fe4997', 'C1', 'Heater', 'relay', NULL, false, NULL, 0, 100, '2026-02-26T11:52:51+00:00', NULL, true, true, '2026-02-26T06:22:55.812576+00:00', NULL),
('de33088c-3731-439b-9fca-e47bd1f459c3', 'C1', 'LED Light', 'pwm', NULL, true, NULL, 0, 100, '2026-02-26T11:52:51+00:00', NULL, true, true, '2026-02-26T06:22:57.756169+00:00', NULL),
('ecc12b69-cea1-47c4-9390-13d89c93e7f9', 'C2', 'Fan', 'relay', NULL, true, NULL, 0, 100, '2026-02-26T12:07:41+00:00', NULL, true, true, '2026-02-26T06:37:43.598262+00:00', NULL),
('da1903d1-5326-4b95-af4c-d4c9250bbc5e', 'C2', 'Heater', 'relay', NULL, false, NULL, 0, 100, '2026-02-26T12:07:41+00:00', NULL, true, true, '2026-02-26T06:37:47.107153+00:00', NULL),
('aa90525f-ea26-4df8-aa4a-22c4a5bb2427', 'C2', 'LED Light', 'pwm', NULL, true, NULL, 0, 100, '2026-02-26T12:07:41+00:00', NULL, true, true, '2026-02-26T06:37:49.042092+00:00', NULL),
('444f8d7c-f5fc-4b37-a913-1b8dd1c00892', 'C1', 'Fan', 'relay', NULL, true, NULL, 0, 100, '2026-02-26T12:11:26+00:00', NULL, true, true, '2026-02-26T06:41:28.104774+00:00', NULL),
('f7d6d44f-06da-4a0a-b76e-4b1249e7010c', 'C1', 'Heater', 'relay', NULL, false, NULL, 0, 100, '2026-02-26T12:11:26+00:00', NULL, true, true, '2026-02-26T06:41:30.859916+00:00', NULL),
('ebacfa49-c157-4b4f-9710-f43838008434', 'C1', 'LED Light', 'pwm', NULL, true, NULL, 0, 100, '2026-02-26T12:11:26+00:00', NULL, true, true, '2026-02-26T06:41:32.886017+00:00', NULL),
('1ddd45b4-8203-4d6b-8fca-be3b5b039c64', 'C1', 'Fan', 'relay', NULL, true, NULL, 0, 100, '2026-02-26T12:13:41+00:00', NULL, true, true, '2026-02-26T06:43:43.931213+00:00', NULL),
('a954ed5b-9fa7-4e7d-93ea-d77d9b04580b', 'C1', 'Heater', 'relay', NULL, false, NULL, 0, 100, '2026-02-26T12:13:41+00:00', NULL, true, true, '2026-02-26T06:43:46.701234+00:00', NULL),
('f0027cab-643e-47d6-82d3-21aec1f53c05', 'C1', 'LED Light', 'pwm', NULL, true, NULL, 0, 100, '2026-02-26T12:13:41+00:00', NULL, true, true, '2026-02-26T06:43:48.976255+00:00', NULL),
('79fb6e80-ed2d-4915-8504-959820c86769', 'C2', 'Fan', 'relay', NULL, true, NULL, 0, 100, '2026-02-26T12:21:15+00:00', NULL, true, true, '2026-02-26T06:51:17.572432+00:00', NULL),
('2e40fb41-3bcd-425c-bf39-53da21d9512d', 'C2', 'Heater', 'relay', NULL, false, NULL, 0, 100, '2026-02-26T12:21:15+00:00', NULL, true, true, '2026-02-26T06:51:21.495087+00:00', NULL),
('ad8b9ee9-4618-43bf-8a40-074350b8293d', 'C2', 'LED Light', 'pwm', NULL, true, NULL, 0, 100, '2026-02-26T12:21:15+00:00', NULL, true, true, '2026-02-26T06:51:23.738868+00:00', NULL),
('7550de3e-ef10-46b8-a62b-4e1ad91973f8', 'C1', 'Fan', 'relay', NULL, true, NULL, 0, 100, '2026-02-26T12:43:31+00:00', NULL, true, true, '2026-02-26T07:13:33.586351+00:00', NULL),
('bc34426c-ddf0-409c-96e0-b38187785f60', 'C1', 'Heater', 'relay', NULL, false, NULL, 0, 100, '2026-02-26T12:43:31+00:00', NULL, true, true, '2026-02-26T07:13:36.079034+00:00', NULL),
('eb239337-4322-4031-81ef-b4ed354d450d', 'C1', 'LED Light', 'pwm', NULL, true, NULL, 0, 100, '2026-02-26T12:43:31+00:00', NULL, true, true, '2026-02-26T07:13:38.185231+00:00', NULL),
('d908b522-a7f1-4fc2-bd6f-a3c21b7cdade', 'C2', 'Fan', 'relay', NULL, true, NULL, 0, 100, '2026-02-26T12:48:00+00:00', NULL, true, true, '2026-02-26T07:18:05.446393+00:00', NULL),
('697392d9-00bd-46e0-adf4-33cbbd9faf8c', 'C2', 'Heater', 'relay', NULL, false, NULL, 0, 100, '2026-02-26T12:48:00+00:00', NULL, true, true, '2026-02-26T07:18:09.968748+00:00', NULL),
('4cb908ae-13bb-488f-b24e-0d049a3fe517', 'C2', 'LED Light', 'pwm', NULL, true, NULL, 0, 100, '2026-02-26T12:48:00+00:00', NULL, true, true, '2026-02-26T07:18:12.507537+00:00', NULL),
('ff7b3c87-eab8-43ce-b0ee-40d3bb6b4240', 'C2', 'Fan', 'relay', NULL, true, NULL, 0, 100, '2026-02-26T12:48:52+00:00', NULL, true, true, '2026-02-26T07:18:54.180645+00:00', NULL),
('0482b852-1eec-4646-93a2-bd1dc9d03226', 'C2', 'Heater', 'relay', NULL, false, NULL, 0, 100, '2026-02-26T12:48:52+00:00', NULL, true, true, '2026-02-26T07:18:58.444848+00:00', NULL),
('591c5935-e72a-4e6a-b9de-bab9bb64ce49', 'C2', 'LED Light', 'pwm', NULL, true, NULL, 0, 100, '2026-02-26T12:48:52+00:00', NULL, true, true, '2026-02-26T07:19:01.005062+00:00', NULL),
('c6d7faf8-0c38-45fd-97ad-69237e94fb92', 'C2', 'Fan', 'relay', NULL, true, NULL, 0, 100, '2026-02-26T12:54:16+00:00', NULL, true, true, '2026-02-26T07:24:18.551001+00:00', NULL),
('b3156190-87a8-4eac-95ae-3cc959e22e5f', 'C2', 'Heater', 'relay', NULL, false, NULL, 0, 100, '2026-02-26T12:54:16+00:00', NULL, true, true, '2026-02-26T07:24:23.19657+00:00', NULL),
('1f4bfc84-4c54-4edf-825d-06ee02b6190e', 'C2', 'LED Light', 'pwm', NULL, true, NULL, 0, 100, '2026-02-26T12:54:16+00:00', NULL, true, true, '2026-02-26T07:24:25.548715+00:00', NULL),
('f08935bd-781a-4604-a9ff-aa65831f7fc5', 'C2', 'Fan', 'relay', NULL, true, NULL, 0, 100, '2026-02-26T13:27:45+00:00', NULL, true, true, '2026-02-26T07:57:47.909269+00:00', NULL),
('fc706d7c-f7ae-408d-9a6b-0d9d02f5a6b9', 'C2', 'Heater', 'relay', NULL, false, NULL, 0, 100, '2026-02-26T13:27:45+00:00', NULL, true, true, '2026-02-26T07:57:52.424354+00:00', NULL),
('d9de2474-3d50-46c6-b0aa-159dc3381ed1', 'C2', 'LED Light', 'pwm', NULL, true, NULL, 0, 100, '2026-02-26T13:27:45+00:00', NULL, true, true, '2026-02-26T07:57:54.686694+00:00', NULL),
('b783aea7-f697-4674-9439-68579a0dd01f', 'C1', 'Fan', 'relay', NULL, true, NULL, 0, 100, '2026-02-26T13:31:32+00:00', NULL, true, true, '2026-02-26T08:01:34.749575+00:00', NULL),
('233997ba-547f-4307-8978-1b5ffdf7fdc2', 'C1', 'Heater', 'relay', NULL, false, NULL, 0, 100, '2026-02-26T13:31:32+00:00', NULL, true, true, '2026-02-26T08:01:37.543433+00:00', NULL),
('a5a42e08-e536-41b2-a17f-4f908353ba96', 'C1', 'LED Light', 'pwm', NULL, false, NULL, 0, 100, '2026-02-26T13:31:32+00:00', NULL, true, true, '2026-02-26T08:01:39.737375+00:00', NULL);

-- Data for Name: readings; Type: TABLE DATA
INSERT INTO public.readings ("reading_id", "device_id", "sensor_id", "temperature", "humidity", "light_level", "recorded_at", "raw_data") VALUES
(1, 'C1', NULL, 25.5, 60, 300, '2026-02-25T16:01:37.092+00:00', NULL),
(2, 'C1', NULL, 45, 65, 70, '2026-02-26T03:34:50+00:00', NULL),
(3, 'C1', NULL, 31.7, 73.7, 865, '2026-02-26T11:45:04+00:00', NULL),
(4, 'C1', NULL, 31.7, 73.7, 852, '2026-02-26T11:45:06+00:00', NULL),
(5, 'C1', NULL, 31.7, 73.7, 866, '2026-02-26T11:45:07+00:00', NULL),
(6, 'C1', NULL, 31.7, 73.7, 860, '2026-02-26T11:45:09+00:00', NULL),
(7, 'C1', NULL, 31.9, 72.8, 840, '2026-02-26T11:52:45+00:00', NULL),
(8, 'C1', NULL, 31.9, 72.8, 836, '2026-02-26T11:52:46+00:00', NULL),
(9, 'C1', NULL, 31.9, 72.9, 837, '2026-02-26T11:52:48+00:00', NULL),
(10, 'C1', NULL, 31.9, 72.9, 840, '2026-02-26T11:52:49+00:00', NULL),
(11, 'C2', NULL, 31.9, 72.7, 95, '2026-02-26T12:07:34+00:00', NULL),
(12, 'C2', NULL, 31.9, 72.7, 95, '2026-02-26T12:07:35+00:00', NULL),
(13, 'C2', NULL, 31.9, 72.9, 95, '2026-02-26T12:07:36+00:00', NULL),
(14, 'C2', NULL, 31.9, 73.3, 95, '2026-02-26T12:07:38+00:00', NULL),
(15, 'C2', NULL, 31.9, 73.4, 95, '2026-02-26T12:07:40+00:00', NULL),
(16, 'C1', NULL, 32.1, 72.1, 980, '2026-02-26T12:11:21+00:00', NULL),
(17, 'C1', NULL, 32.1, 72.1, 957, '2026-02-26T12:11:23+00:00', NULL),
(18, 'C1', NULL, 32.1, 72.1, 955, '2026-02-26T12:11:24+00:00', NULL),
(19, 'C1', NULL, 32.1, 72, 918, '2026-02-26T12:13:38+00:00', NULL),
(20, 'C1', NULL, 32.1, 72, 916, '2026-02-26T12:13:39+00:00', NULL),
(21, 'C1', NULL, 32.1, 72, 908, '2026-02-26T12:13:40+00:00', NULL),
(22, 'C2', NULL, 32, 71.3, 96, '2026-02-26T12:21:08+00:00', NULL),
(23, 'C2', NULL, 32, 71.2, 96, '2026-02-26T12:21:10+00:00', NULL),
(24, 'C2', NULL, 32, 71.1, 96, '2026-02-26T12:21:11+00:00', NULL),
(25, 'C2', NULL, 32, 71.1, 97, '2026-02-26T12:21:12+00:00', NULL),
(26, 'C2', NULL, 32, 71.1, 97, '2026-02-26T12:21:14+00:00', NULL),
(27, 'C1', NULL, 32.6, 69.9, 810, '2026-02-26T12:34:20+00:00', NULL),
(28, 'C1', NULL, 32.6, 70, 817, '2026-02-26T12:34:26+00:00', NULL),
(29, 'C1', NULL, 32.6, 70.1, 885, '2026-02-26T12:34:28+00:00', NULL),
(30, 'C1', NULL, 32.5, 70.1, 858, '2026-02-26T12:34:29+00:00', NULL),
(31, 'C1', NULL, 32.4, 70.9, 898, '2026-02-26T12:43:24+00:00', NULL),
(32, 'C1', NULL, 32.5, 70.8, 899, '2026-02-26T12:43:26+00:00', NULL),
(33, 'C1', NULL, 32.4, 70.8, 897, '2026-02-26T12:43:28+00:00', NULL),
(34, 'C1', NULL, 32.4, 70.8, 885, '2026-02-26T12:43:30+00:00', NULL),
(35, 'C2', NULL, 32.5, 70.3, 171, '2026-02-26T12:47:58+00:00', NULL),
(36, 'C2', NULL, 32.5, 71, 175, '2026-02-26T12:48:47+00:00', NULL),
(37, 'C2', NULL, 32.5, 70.8, 168, '2026-02-26T12:48:49+00:00', NULL),
(38, 'C2', NULL, 32.5, 70.3, 171, '2026-02-26T12:52:31+00:00', NULL),
(39, 'C2', NULL, 32.5, 70.5, 177, '2026-02-26T12:54:12+00:00', NULL),
(40, 'C2', NULL, 32.5, 70.5, 177, '2026-02-26T12:54:13+00:00', NULL),
(41, 'C2', NULL, 32.5, 70.5, 173, '2026-02-26T12:54:15+00:00', NULL),
(42, 'C2', NULL, 32.6, 69.8, 178, '2026-02-26T13:12:14+00:00', NULL),
(43, 'C2', NULL, 32.6, 69.8, 177, '2026-02-26T13:12:17+00:00', NULL),
(44, 'C2', NULL, 32.5, 70.7, 204, '2026-02-26T13:27:40+00:00', NULL),
(45, 'C2', NULL, 32.5, 70.9, 208, '2026-02-26T13:27:42+00:00', NULL),
(46, 'C2', NULL, 32.5, 70.9, 208, '2026-02-26T13:27:43+00:00', NULL),
(47, 'C1', NULL, 33.1, 67.7, 1072, '2026-02-26T13:31:30+00:00', NULL);

-- Data for Name: alert_rules; Type: TABLE DATA
INSERT INTO public.alert_rules ("rule_id", "name", "description", "device_id", "condition", "condition_json", "severity", "notification_channels", "is_active", "cooldown_minutes", "created_by_user_id", "created_at", "updated_at", "updated_by_user_id", "deleted_at") VALUES
('31fdd1fd-5ffa-4fcc-970a-5ee6ed1ce107', 'High Temperature', NULL, NULL, 'temperature > 30', NULL, 'critical', 'app,email', true, 0, 'ab97fd38-c7e8-486a-8a37-a3f39c7e98d6', '2026-02-23T04:20:40.772318+00:00', '2026-02-23T04:20:40.772318+00:00', NULL, NULL),
('a62f158d-70b4-4f2d-912c-861e79600640', 'Low Temperature', NULL, NULL, 'temperature < 20', NULL, 'warning', 'app,email', true, 0, 'ab97fd38-c7e8-486a-8a37-a3f39c7e98d6', '2026-02-23T04:20:40.772318+00:00', '2026-02-23T04:20:40.772318+00:00', NULL, NULL),
('b374088f-82ee-42e4-b7a4-ca34dbefc2ea', 'High Humidity', NULL, NULL, 'humidity > 75', NULL, 'warning', 'app', true, 0, 'ab97fd38-c7e8-486a-8a37-a3f39c7e98d6', '2026-02-23T04:20:40.772318+00:00', '2026-02-23T04:20:40.772318+00:00', NULL, NULL),
('a0f780aa-907b-48e3-880f-84e83eab87dd', 'Device Offline', NULL, NULL, 'no_data > 60', NULL, 'critical', 'app,email', true, 0, 'ab97fd38-c7e8-486a-8a37-a3f39c7e98d6', '2026-02-23T04:20:40.772318+00:00', '2026-02-23T04:20:40.772318+00:00', NULL, NULL);

-- Data for Name: control_actions; Type: TABLE DATA
INSERT INTO public.control_actions ("action_id", "device_id", "actuator_id", "action_type", "new_status", "new_value", "previous_status", "previous_value", "reason", "initiated_by_user_id", "triggered_by_rule_id", "status", "error_message", "timestamp") VALUES
('716bff5a-ff23-4b6e-855b-d3e297843630', 'C1', 'ec8e76b4-bf36-4454-bb25-d51eeeba88a3', 'activate', true, NULL, false, NULL, 'Manual trigger', '920641bf-329e-4603-9308-2cc74ff74b74', NULL, 'success', NULL, '2026-02-25T16:23:31.195063+00:00'),
('9fc44527-ffad-480d-8d3e-5faf9b85e15d', 'C2', '71f78cc9-e865-4fb7-b970-799517356249', 'activate', true, NULL, false, NULL, 'Auto control - sensor threshold', NULL, NULL, 'success', NULL, '2026-02-26T12:07:41+00:00'),
('dbac4821-e9ab-4640-ba5b-39cdf483b70d', 'C2', '71f78cc9-e865-4fb7-b970-799517356249', 'activate', true, NULL, false, NULL, 'Auto control - sensor threshold', NULL, NULL, 'success', NULL, '2026-02-26T12:21:15+00:00'),
('cf671593-4dc8-4400-9a5c-9d8d8746e1b6', 'C2', '71f78cc9-e865-4fb7-b970-799517356249', 'activate', true, NULL, false, NULL, 'Auto control - sensor threshold', NULL, NULL, 'success', NULL, '2026-02-26T12:48:00+00:00'),
('b4216d75-a70e-44ee-821f-ed3ecc921897', 'C2', '71f78cc9-e865-4fb7-b970-799517356249', 'activate', true, NULL, false, NULL, 'Auto control - sensor threshold', NULL, NULL, 'success', NULL, '2026-02-26T12:48:52+00:00'),
('c079a03f-f0e8-439f-9cf7-cb7cf507b056', 'C2', '71f78cc9-e865-4fb7-b970-799517356249', 'activate', true, NULL, false, NULL, 'Auto control - sensor threshold', NULL, NULL, 'success', NULL, '2026-02-26T12:54:16+00:00'),
('bce66837-fbeb-42d3-abbe-460832b14d84', 'C2', '71f78cc9-e865-4fb7-b970-799517356249', 'activate', true, NULL, false, NULL, 'Auto control - sensor threshold', NULL, NULL, 'success', NULL, '2026-02-26T13:27:45+00:00');

-- Data for Name: device_settings; Type: TABLE DATA
INSERT INTO public.device_settings ("setting_id", "device_id", "polling_interval_seconds", "data_retention_days", "timezone", "coordinates_lat", "coordinates_lon", "metadata", "created_at", "updated_at") VALUES
('77fbab03-9d92-47e0-b363-47b576b3c7ee', 'C1', 15, 90, 'UTC', NULL, NULL, NULL, '2026-02-23T04:20:40.772318+00:00', '2026-02-23T04:20:40.772318+00:00'),
('c5e76304-21fe-422c-a494-90bcb3730f24', 'C2', 15, 90, 'UTC', NULL, NULL, NULL, '2026-02-23T04:20:40.772318+00:00', '2026-02-23T04:20:40.772318+00:00');

-- Data for Name: user_preferences; Type: TABLE DATA
INSERT INTO public.user_preferences ("preference_id", "user_id", "theme", "notifications_enabled", "email_alerts", "sms_alerts", "push_alerts", "daily_summary_email", "dashboard_refresh_interval", "timezone", "language", "metadata", "created_at", "updated_at") VALUES
('326435d4-4173-400a-b50e-eec06d2e03ec', 'ab97fd38-c7e8-486a-8a37-a3f39c7e98d6', 'light', true, true, false, true, true, 15, 'UTC', 'en', NULL, '2026-02-23T04:20:40.772318+00:00', '2026-02-23T04:20:40.772318+00:00'),
('0894783f-3c34-474c-9b51-86575e614ea8', 'c4f4fbdd-73a3-4673-93e0-b709c4b0b999', 'dark', true, true, false, true, true, 15, 'UTC', 'en', NULL, '2026-02-23T04:20:40.772318+00:00', '2026-02-23T04:20:40.772318+00:00'),
('ec38df9b-5751-40b6-be3e-2551eb84528f', '920641bf-329e-4603-9308-2cc74ff74b74', 'dark', true, true, false, true, true, 15, 'UTC', 'en', NULL, '2026-02-25T15:57:05.865926+00:00', '2026-02-25T15:57:05.865926+00:00');

-- Data for Name: automation_rules; Type: TABLE DATA
INSERT INTO public.automation_rules ("rule_id", "name", "description", "device_id", "trigger_condition", "trigger_condition_json", "action", "action_json", "is_active", "execution_count", "last_triggered", "created_by_user_id", "created_at", "updated_at") VALUES
('096bb56d-61e2-4888-9510-35613052a89b', 'Heater OFF (High Temp)', NULL, 'C1', 'temperature > 30', NULL, 'turn_heater_off', NULL, true, 0, NULL, 'ab97fd38-c7e8-486a-8a37-a3f39c7e98d6', '2026-02-26T10:15:12.72041+00:00', '2026-02-26T10:15:12.72041+00:00'),
('7e5b7870-aec6-4267-8bd9-468f47e359c8', 'Fan ON (High Temp)', NULL, 'C1', 'temperature > 30', NULL, 'turn_fan_on', NULL, true, 0, NULL, 'ab97fd38-c7e8-486a-8a37-a3f39c7e98d6', '2026-02-26T10:15:12.917149+00:00', '2026-02-26T10:15:12.917149+00:00'),
('daf291e1-cc94-4ad1-a3e9-c1c9a61bde17', 'Fan OFF (Low Temp)', NULL, 'C1', 'temperature < 25', NULL, 'turn_fan_off', NULL, true, 0, NULL, 'ab97fd38-c7e8-486a-8a37-a3f39c7e98d6', '2026-02-26T10:15:13.106599+00:00', '2026-02-26T10:15:13.106599+00:00'),
('bd99b824-a985-4e16-bae7-d21212ee65ff', 'Light ON (Low Lux)', NULL, 'C1', 'light_level < 200', NULL, 'turn_light_on', NULL, true, 0, NULL, 'ab97fd38-c7e8-486a-8a37-a3f39c7e98d6', '2026-02-26T10:15:13.314763+00:00', '2026-02-26T10:15:13.314763+00:00'),
('4489a335-4d55-4bdc-b2d3-aeebef34b345', 'Heater ON (Low Temp)', NULL, 'C2', 'temperature < 25', NULL, 'turn_heater_on', NULL, true, 0, NULL, 'ab97fd38-c7e8-486a-8a37-a3f39c7e98d6', '2026-02-26T10:15:13.775928+00:00', '2026-02-26T10:15:13.775928+00:00'),
('0c97e8cd-ce77-4c3f-bbba-b5482fb82544', 'Heater OFF (High Temp)', NULL, 'C2', 'temperature > 30', NULL, 'turn_heater_off', NULL, true, 0, NULL, 'ab97fd38-c7e8-486a-8a37-a3f39c7e98d6', '2026-02-26T10:15:13.991617+00:00', '2026-02-26T10:15:13.991617+00:00'),
('ba15c5f2-bce4-43ca-90f1-51d09c787991', 'Fan ON (High Temp)', NULL, 'C2', 'temperature > 30', NULL, 'turn_fan_on', NULL, true, 0, NULL, 'ab97fd38-c7e8-486a-8a37-a3f39c7e98d6', '2026-02-26T10:15:14.208829+00:00', '2026-02-26T10:15:14.208829+00:00'),
('769fb59a-041a-4256-a62a-0edfafb2baf9', 'Fan OFF (Low Temp)', NULL, 'C2', 'temperature < 25', NULL, 'turn_fan_off', NULL, true, 0, NULL, 'ab97fd38-c7e8-486a-8a37-a3f39c7e98d6', '2026-02-26T10:15:14.407041+00:00', '2026-02-26T10:15:14.407041+00:00'),
('dfccc58c-4c19-466d-9c70-f2732ce2cc83', 'Light ON (Low Lux)', NULL, 'C2', 'light_level < 200', NULL, 'turn_light_on', NULL, true, 0, NULL, 'ab97fd38-c7e8-486a-8a37-a3f39c7e98d6', '2026-02-26T10:15:14.634097+00:00', '2026-02-26T10:15:14.634097+00:00'),
('86cb445e-a8ab-48f2-8362-03c192748123', 'Light OFF (High Lux)', NULL, 'C2', 'light_level > 800', NULL, 'turn_light_off', NULL, true, 0, NULL, 'ab97fd38-c7e8-486a-8a37-a3f39c7e98d6', '2026-02-26T10:15:14.849378+00:00', '2026-02-26T10:15:14.849378+00:00'),
('8a9f0d35-3952-4ee5-8f4d-dae0cfbe004f', 'Light OFF (High Lux)', NULL, 'C1', 'light_level > 500', NULL, 'turn_light_off', NULL, true, 0, NULL, 'ab97fd38-c7e8-486a-8a37-a3f39c7e98d6', '2026-02-26T10:15:13.551248+00:00', '2026-02-26T10:19:41.357319+00:00'),
('57d9374b-c4f4-4e70-b6be-30837155f679', 'Heater ON (Low Temp)', NULL, 'C1', 'temperature < 25', NULL, 'turn_heater_on', NULL, false, 0, NULL, 'ab97fd38-c7e8-486a-8a37-a3f39c7e98d6', '2026-02-26T10:15:12.277417+00:00', '2026-02-26T10:29:26.218705+00:00');

-- Data for Name: audit_log; Type: TABLE DATA
INSERT INTO public.audit_log ("audit_id", "user_id", "device_id", "action", "action_type", "entity_type", "entity_id", "old_values", "new_values", "changes", "ip_address", "user_agent", "status", "error_message", "timestamp") VALUES
('2a7874b5-4794-4887-86e8-0507d4433410', NULL, 'C1', 'auto_control_update', 'execute', 'device', 'C1', NULL, '{"temperature":31.7,"humidity":73.7,"light_level":860,"heater":false,"fan":true,"light":true}', 'H:OFF F:ON L:ON', NULL, NULL, 'success', NULL, '2026-02-26T11:45:18+00:00'),
('0b1d3293-7228-43f1-abc1-44298a198f73', NULL, 'C2', 'auto_control_update', 'execute', 'device', 'C2', NULL, '{"temperature":31.9,"humidity":73.4,"light_level":95,"heater":false,"fan":true,"light":true}', 'H:OFF F:ON L:ON', NULL, NULL, 'success', NULL, '2026-02-26T12:07:49+00:00'),
('de50295f-9cd1-4d0c-ae0d-394aedf8c3bc', NULL, 'C1', 'auto_control_update', 'execute', 'device', 'C1', NULL, '{"temperature":32.1,"humidity":72.1,"light_level":955,"heater":false,"fan":true,"light":true}', 'H:OFF F:ON L:ON', NULL, NULL, 'success', NULL, '2026-02-26T12:11:33+00:00'),
('77be14ef-57eb-43e9-b9cd-05887691ab7d', NULL, 'C1', 'auto_control_update', 'execute', 'device', 'C1', NULL, '{"temperature":32.1,"humidity":72,"light_level":908,"heater":false,"fan":true,"light":true}', 'H:OFF F:ON L:ON', NULL, NULL, 'success', NULL, '2026-02-26T12:13:49+00:00'),
('f0c68501-e295-4d27-9822-b6f9066c1752', NULL, 'C1', 'auto_control_update', 'execute', 'device', 'C1', NULL, '{"temperature":32.4,"humidity":70.8,"light_level":885,"heater":false,"fan":true,"light":true}', 'H:OFF F:ON L:ON', NULL, NULL, 'success', NULL, '2026-02-26T12:43:38+00:00'),
('dce5534d-ad7d-4d26-927e-e41ab6192e53', NULL, 'C2', 'auto_control_update', 'execute', 'device', 'C2', NULL, '{"temperature":32.5,"humidity":70.3,"light_level":171,"heater":false,"fan":true,"light":true}', 'H:OFF F:ON L:ON', NULL, NULL, 'success', NULL, '2026-02-26T12:48:13+00:00'),
('5f931705-26fa-4e43-9e54-d7150905c0c1', NULL, 'C2', 'auto_control_update', 'execute', 'device', 'C2', NULL, '{"temperature":32.5,"humidity":70.8,"light_level":168,"heater":false,"fan":true,"light":true}', 'H:OFF F:ON L:ON', NULL, NULL, 'success', NULL, '2026-02-26T12:49:01+00:00'),
('107adcba-7350-46da-a584-40c90e353ba2', NULL, 'C2', 'auto_control_update', 'execute', 'device', 'C2', NULL, '{"temperature":32.5,"humidity":70.9,"light_level":208,"heater":false,"fan":true,"light":true}', 'H:OFF F:ON L:ON', NULL, NULL, 'success', NULL, '2026-02-26T13:27:55+00:00'),
('0f9eaa9c-db77-4d56-83b8-c4431df48f1e', NULL, 'C1', 'auto_control_update', 'execute', 'device', 'C1', NULL, '{"temperature":33.1,"humidity":67.7,"light_level":1072,"heater":false,"fan":true,"light":false}', 'H:OFF F:ON L:OFF', NULL, NULL, 'success', NULL, '2026-02-26T13:31:40+00:00');

