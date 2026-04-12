
-- Auto-cancel appointments that are still SCHEDULED more than 3 hours
-- past their endTime. Guards against appointments "disappearing" when
-- a provider forgets to hit Complete Visit.
--
-- Runs every 15 minutes. Unschedule with:
--   SELECT cron.unschedule('auto_cancel_stale_appointments');
--
-- The DO block makes this migration idempotent — re-running it won't
-- error if the job already exists from a previous manual setup.
DO $$
BEGIN
  IF current_database() = 'postgres' THEN
    CREATE EXTENSION IF NOT EXISTS pg_cron;

    IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'auto_cancel_stale_appointments') THEN
      PERFORM cron.schedule(
        'auto_cancel_stale_appointments',
        '*/15 * * * *',
        $job$UPDATE public."Appointment"
          SET status = 'CANCELLED', "updatedAt" = now()
          WHERE status = 'SCHEDULED'
            AND "endTime" < (now() AT TIME ZONE 'UTC') - interval '3 hours'$job$
      );
    END IF;
  END IF;
END $$;
