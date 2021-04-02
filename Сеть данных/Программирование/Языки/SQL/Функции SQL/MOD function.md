==MOD(dividend, divisor)== - находист остаток от деления на divisor.

***Примеры:***
```sql
SQL> select MOD(7,3) from dual;

  MOD(7,3)
----------
         1

SQL> select MOD(9,3) from dual;

  MOD(9,3)
----------
         0

SQL> select MOD(34, -5) from dual;

MOD(34,-5)
----------
         4

SQL> select MOD(-34, 5) from dual;

MOD(-34,5)
----------
        -4
		
SQL> select MOD(3.1, 1.2) from dual;

MOD(3.1,1.2)
------------
          .7
```
---
*теги:* #базы_данных, #sql/function/single-row/numeric_func 