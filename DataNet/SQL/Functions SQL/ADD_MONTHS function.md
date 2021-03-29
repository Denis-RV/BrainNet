==ADD\_MONTHS(date, number_of_months)== - добавляем к дате количество месяцев.

***Примеры:***
```sql
SQL> select ADD_MONTHS('30.NOV.19', 0), ADD_MONTHS('30.NOV.19', 1) from dual;

ADD_MONTH ADD_MONTH
--------- ---------
30-NOV-19 31-DEC-19
```
---
*tags:* #database, #sql, #sqlFunction #date_func #single-row_func 