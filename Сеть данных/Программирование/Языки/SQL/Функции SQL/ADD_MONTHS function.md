==ADD\_MONTHS(date, number_of_months)== - добавляем к дате количество месяцев.

***Примеры:***
```sql
SQL> select ADD_MONTHS('30.NOV.19', 0), ADD_MONTHS('30.NOV.19', 1) from dual;

ADD_MONTH ADD_MONTH
--------- ---------
30-NOV-19 31-DEC-19
```
---
*теги:* #базы_данных, #sql/function/single-row/date 