-- ============================================================================
-- Seed: Sample Brooklyn restaurants (for initial development/testing)
-- ============================================================================
-- IMPORTANT: These are realistic-but-illustrative seed rows for development
-- only. Before launch, every single restaurant must be re-verified against
-- current hechsher status. Hechshers change. Do not trust this seed for prod.
-- ============================================================================

insert into restaurants (slug, name, address, city, state, zip, lat, lng, phone, cuisine_tags, price_level, category, cholov_yisroel, pas_yisroel, verification_status, last_verified_at) values
  ('sample-deli-midwood', 'Sample Kosher Deli', '1234 Avenue J', 'Brooklyn', 'NY', '11230', 40.6249, -73.9626, '718-555-0101', array['deli', 'sandwiches', 'jewish-american'], 2, 'meat', false, false, 'pending', null),
  ('sample-pizza-flatbush', 'Sample Kosher Pizza', '5678 Coney Island Ave', 'Brooklyn', 'NY', '11230', 40.6201, -73.9645, '718-555-0102', array['pizza', 'italian', 'dairy'], 1, 'dairy', true, true, 'pending', null),
  ('sample-sushi-boroPark', 'Sample Kosher Sushi', '4321 13th Ave', 'Brooklyn', 'NY', '11219', 40.6332, -73.9925, '718-555-0103', array['sushi', 'japanese', 'pareve'], 3, 'pareve', false, true, 'pending', null),
  ('sample-falafel-marine-park', 'Sample Falafel Spot', '2400 Avenue U', 'Brooklyn', 'NY', '11229', 40.5990, -73.9445, '718-555-0104', array['middle-eastern', 'falafel', 'pareve'], 1, 'pareve', false, false, 'pending', null),
  ('sample-grill-flatlands', 'Sample Glatt Grill', '1800 Kings Highway', 'Brooklyn', 'NY', '11229', 40.6075, -73.9555, '718-555-0105', array['grill', 'meat', 'israeli'], 3, 'meat', false, true, 'pending', null)
on conflict (slug) do nothing;
