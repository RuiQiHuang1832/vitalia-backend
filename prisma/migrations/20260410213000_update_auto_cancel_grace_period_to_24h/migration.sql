-- Update the auto-cancel cron job to use a 24-hour grace period instead of 3.
-- Guarded so the shadow DB (which has no pg_cron) skips it cleanly.
DO $$
BEGIN
  IF current_database() = 'postgres' THEN
    PERFORM cron.alter_job(
      job_id := (SELECT jobid FROM cron.job WHERE jobname = 'auto_cancel_stale_appointments'),
      command := $job$UPDATE public."Appointment"
        SET status = 'CANCELLED', "updatedAt" = now()
        WHERE status = 'SCHEDULED'
          AND "endTime" < (now() AT TIME ZONE 'UTC') - interval '24 hours'$job$
    );
  END IF;
END $$;
