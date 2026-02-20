-- Fix credits_refunds RLS: shop-only access via users table

ALTER POLICY "credits_refunds_select_policy" ON "public"."credits_refunds"
TO public
USING (shop_id = (SELECT users.shop_id FROM users WHERE users.id = auth.uid()));

ALTER POLICY "credits_refunds_insert_policy" ON "public"."credits_refunds"
TO public
WITH CHECK (shop_id = (SELECT users.shop_id FROM users WHERE users.id = auth.uid()));

ALTER POLICY "credits_refunds_update_policy" ON "public"."credits_refunds"
TO public
USING (shop_id = (SELECT users.shop_id FROM users WHERE users.id = auth.uid()))
WITH CHECK (shop_id = (SELECT users.shop_id FROM users WHERE users.id = auth.uid()));

ALTER POLICY "credits_refunds_delete_policy" ON "public"."credits_refunds"
TO public
USING (shop_id = (SELECT users.shop_id FROM users WHERE users.id = auth.uid()));

-- credits_refunds_history
ALTER POLICY "credits_refunds_history_select_policy" ON "public"."credits_refunds_history"
TO public
USING (
    EXISTS (
        SELECT 1 FROM credits_refunds cr
        WHERE cr.id = credits_refunds_history.credits_refund_id
        AND cr.shop_id = (SELECT users.shop_id FROM users WHERE users.id = auth.uid())
    )
);

ALTER POLICY "credits_refunds_history_insert_policy" ON "public"."credits_refunds_history"
TO public
WITH CHECK (
    EXISTS (
        SELECT 1 FROM credits_refunds cr
        WHERE cr.id = credits_refunds_history.credits_refund_id
        AND cr.shop_id = (SELECT users.shop_id FROM users WHERE users.id = auth.uid())
    )
);
