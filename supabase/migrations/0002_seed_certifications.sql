-- ============================================================================
-- Seed: Major US kosher certification agencies
-- ============================================================================
-- stringency_level scale (rough, for sorting/default-filter purposes):
--   1 = broadly accepted, mainstream
--   2 = mainstream, widely accepted
--   3 = standard mainstream
--   4 = stringent, hechsher of choice for more observant communities
--   5 = most stringent, accepted only by specific communities

insert into certifications (agency_name, agency_slug, agency_short_name, agency_website, stringency_level, description) values
  ('Orthodox Union', 'ou', 'OU', 'https://oukosher.org', 2, 'The largest kosher certification agency in the world. The "OU" symbol is the most widely recognized hechsher in North America.'),
  ('OK Kosher Certification', 'ok', 'OK', 'https://www.ok.org', 2, 'One of the "Big Five" US kosher certifiers. Based in Brooklyn.'),
  ('Kof-K Kosher Supervision', 'kof-k', 'Kof-K', 'https://www.kof-k.org', 2, 'Major US certifier based in Teaneck, NJ.'),
  ('Star-K Kosher Certification', 'star-k', 'Star-K', 'https://www.star-k.org', 2, 'Major US certifier based in Baltimore.'),
  ('Chicago Rabbinical Council', 'crc', 'cRc', 'https://www.crcweb.org', 3, 'Regional/national certifier headquartered in Chicago.'),
  ('Vaad Harabonim of Queens', 'vhq', 'VHQ', 'https://vaadqueens.org', 3, 'Queens-based vaad with extensive restaurant supervision in Queens and Long Island.'),
  ('Kehilah Kashrus', 'kehilah', 'Kehilah', null, 3, 'Brooklyn-based hechsher widely used in Flatbush and surrounding communities.'),
  ('Vaad Hakashrus of Five Towns and Far Rockaway', 'vaad-5t', 'Vaad of the Five Towns', 'https://vaadoffivetowns.org', 3, 'Local vaad covering the Five Towns and Far Rockaway area.'),
  ('Central Rabbinical Congress', 'crc-hisachdus', 'CRC (Hisachdus)', null, 5, 'Hisachdus Harabonim — stringent hechsher, primarily accepted in chassidish communities.'),
  ('Hisachdus Harabonim', 'hisachdus', 'Hisachdus', null, 5, 'Stringent hechsher used widely in Williamsburg and chassidish communities.'),
  ('Tartikov', 'tartikov', 'Tartikov', null, 5, 'Stringent hechsher widely used by certain yeshivish communities.'),
  ('Khal Adath Jeshurun (KAJ)', 'kaj', 'KAJ', 'https://www.kajinc.org', 4, 'Washington Heights-based hechsher, "Breuer''s," accepted by yekkish and broader observant communities.'),
  ('Rabbi Yisroel Belsky / Aleph-K', 'aleph-k', 'Aleph-K', null, 4, 'Hechsher associated with Rabbi Belsky z"l, used in select Brooklyn establishments.'),
  ('Vaad Hakashrus of Crown Heights', 'vhch', 'Crown Heights Vaad', null, 3, 'Lubavitch-affiliated vaad covering Crown Heights establishments.'),
  ('Rabbi Don Yoel Levy / OK Select', 'ok-select', 'OK Select', 'https://www.ok.org', 3, 'OK''s stricter tier of supervision.'),
  ('Va''ad HaRabonim of Riverdale', 'vaad-riverdale', 'Vaad of Riverdale', null, 3, 'Riverdale, NY local vaad.'),
  ('Rabbinical Council of California (RCC)', 'rcc', 'RCC', 'https://rccvaad.org', 3, 'Los Angeles regional certifier.'),
  ('Kashruth Council of Canada (COR)', 'cor', 'COR', 'https://www.cor.ca', 2, 'Largest Canadian kosher certifier.'),
  ('Earth Kosher', 'earth-kosher', 'EarthKosher', 'https://earthkosher.com', 2, 'National certifier, often seen on natural/organic products and some restaurants.')
on conflict (agency_slug) do nothing;
