package utils

import "time"

func ParseDate(s string) (time.Time, error) {
	for _, fmt := range []string{"2006-01-02", "2006-01-02 15:04:05", time.RFC3339} {
		if t, err := time.Parse(fmt, s); err == nil {
			return t, nil
		}
	}
	return time.Time{}, nil
}

type TimePtr *time.Time
