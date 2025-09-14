-- First, add the new enum values separately
SELECT add_enum_value_if_not_exists('app_role', 'pro_user');
SELECT add_enum_value_if_not_exists('app_role', 'traq_arborist');